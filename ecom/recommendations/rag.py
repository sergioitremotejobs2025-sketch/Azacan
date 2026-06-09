import os
import re
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from pgvector.django import CosineDistance
from recommendations.models import Book, Purchase, SearchQueryCache
from sentence_transformers import SentenceTransformer, CrossEncoder
from django.core.cache import cache
from django.contrib.auth.models import User
import numpy as np
import logging
import torch
import hashlib
from concurrent.futures import ThreadPoolExecutor

# FORCE CPU USAGE FOR STABILITY IN VARIED ENVIRONMENTS
os.environ['CUDA_VISIBLE_DEVICES'] = ''
try:
    torch.set_default_device('cpu')
except Exception:
    pass

logger = logging.getLogger(__name__)

# Singleton pattern for model caching
_model_cache = None

def get_sentence_transformer_model():
    """
    Get or create a cached SentenceTransformer model.
    Uses module-level singleton pattern to avoid reloading on every request.
    """
    global _model_cache
    if _model_cache is None:
        logger.info("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
        _model_cache = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
        logger.info("Model loaded successfully")
    return _model_cache

_reranker_cache = None

def get_reranker_model():
    """
    Get or create a cached CrossEncoder model.
    """
    global _reranker_cache
    if _reranker_cache is None:
        logger.info("Loading CrossEncoder model 'cross-encoder/ms-marco-MiniLM-L-6-v2'...")
        _reranker_cache = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', device='cpu') 
        logger.info("Reranker loaded successfully")
    return _reranker_cache


def get_recommendations(user_id, top_k=3):
    """
    Generate book recommendations for a user based on their purchase history using RAG.
    
    Args:
        user_id (int): The ID of the user to generate recommendations for
        top_k (int): Number of similar books to retrieve (default: 3)
    
    Returns:
        list: List of dictionaries containing recommendation details
    """
    # Check cache first
    cache_key = f"recommendations_v6_{user_id}_{top_k}"
    cached_result = cache.get(cache_key)
    if cached_result:
        logger.info(f"Returning cached recommendations for user {user_id}")
        return cached_result
    
    try:
        # Import Product model to map Book -> Product via reference
        from store.models import Product
        
        # Validate user exists
        if not User.objects.filter(id=user_id).exists():
            return []
        
        # Get past purchases
        past_books = Purchase.objects.filter(user_id=user_id).values_list('book_id', flat=True)
        
        if not past_books:
            return []
        
        # Get embeddings for past purchases
        past_embeddings = Book.objects.filter(id__in=past_books).values_list('embedding', flat=True)
        
        # Filter out None embeddings
        valid_embeddings = [emb for emb in past_embeddings if emb is not None]
        
        if not valid_embeddings:
            return []
        
        # Calculate average embedding
        average_embedding = np.mean(valid_embeddings, axis=0)
        
        # Retrieve larger pool of similar books for diversity (e.g. top 20)
        candidate_books = list(Book.objects.exclude(id__in=past_books).annotate(
            distance=CosineDistance('embedding', average_embedding)
        ).order_by('distance')[:20])
        
        if not candidate_books:
            return []
            
        import random
        # Randomly sample top_k from the candidates to provide variety
        sample_size = min(len(candidate_books), top_k)
        similar_books = random.sample(candidate_books, sample_size)
        
        # Sort them back by distance
        similar_books.sort(key=lambda x: x.distance)
        
        # Build a reference -> Product ID lookup for the selected books
        book_references = [b.reference for b in similar_books if b.reference]
        product_map = {}
        if book_references:
            products = Product.objects.filter(reference__in=book_references).values_list('reference', 'id')
            product_map = {ref: pid for ref, pid in products}
        
        # Format retrieved books for context
        context = "\n".join([
            f"Title: {b.title}, Author: {b.author}, Description: {b.description}" 
            for b in similar_books
        ])
        
        # LLM generation
        try:
            llm = ChatOllama(model="deepseek-coder:1.3b", temperature=0.7, base_url=os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434'))
            prompt = ChatPromptTemplate.from_template(
            """You are a helpful book expert.
            
                Here are {count} books recommended for a user:
                {context}

                Write a short, engaging 1-sentence reason for recommending EACH book.
                
                Return the reasons as a list valid JSON strings.
                Example format: ["Reason for book 1", "Reason for book 2", "Reason for book 3"]
                
                Strictly return ONLY the JSON list. No other text.
            """
            )
            chain = prompt | llm | StrOutputParser()
            response_text = chain.invoke({"context": context, "count": len(similar_books)})
            
            import json
            def robust_json_parse(text):
                try:
                    # 1. Clean common LLM artifacts
                    clean = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
                    clean = clean.replace("```json", "").replace("```", "").strip()
                    # 2. Extract first array-like structure if it exists
                    match = re.search(r'\[.*\]', clean, re.DOTALL)
                    if match:
                        clean = match.group(0)
                    # 3. Basic repair for missing closing brackets/quotes
                    if clean.startswith('[') and not clean.endswith(']'):
                         if not clean.endswith('"'): clean += '"'
                         clean += ']'
                    return json.loads(clean)
                except Exception:
                    return None

            reasons = robust_json_parse(response_text)
            if reasons is None:
                logger.warning(f"Failed to parse LLM JSON response: {response_text}")
                reasons = [f"Recommended because it's similar to your taste." for _ in similar_books]

            if not isinstance(reasons, list) or len(reasons) < len(similar_books):
                 if not isinstance(reasons, list):
                     reasons = []
                 reasons.extend([f"A great choice based on your history." for _ in range(len(similar_books) - len(reasons))])
            
            # Construct structured result with Product ID for cart integration
            structured_recommendations = []
            for i, book in enumerate(similar_books):
                product_id = product_map.get(book.reference)
                if product_id:  # Only include if we can map to a Product
                    structured_recommendations.append({
                        'book': book,
                        'product_id': product_id,
                        'reason': reasons[i]
                    })

            cache.set(cache_key, structured_recommendations, 3600)
            return structured_recommendations
            
        except Exception as llm_error:
            logger.error(f"LLM generation failed for user {user_id}: {llm_error}")
            fallback = []
            for b in similar_books:
                product_id = product_map.get(b.reference)
                if product_id:
                    fallback.append({'book': b, 'product_id': product_id, 'reason': "Recommended based on your history."})
            return fallback
    
    except Exception as e:
        logger.error(f"Error generating recommendations for user {user_id}: {e}")
        return [] # Return empty list on error


def get_recommendations_by_book_title(book_title: str, top_k: int = 5) -> str:
    """
    Generate book recommendations based on a given book title using vector similarity (RAG-style).

    Args:
        book_title (str): The title of the book to find similar books for
        top_k (int): Number of similar books to retrieve (default: 5)

    Returns:
        str: LLM-generated recommendations in HTML format or fallback message
    """
    cache_key = f"recommendations_title_{book_title.lower()}_{top_k}"
    cached_result = cache.get(cache_key)
    if cached_result:
        logger.info(f"Cache hit for recommendations: {book_title}")
        return cached_result

    try:
        # Step 1: Find the reference book by title
        try:
            reference_book = Book.objects.get(title__iexact=book_title)
        except Book.DoesNotExist:
            return f"Sorry, we couldn't find a book titled '{book_title}' in our catalog."
        except Book.MultipleObjectsReturned:
            # Use the first match if multiple
            reference_book = Book.objects.filter(title__iexact=book_title).first()

        if reference_book.embedding is None:
            return f"We don't have embedding data for '{book_title}' yet. Please try another book."

        reference_embedding = reference_book.embedding

        # Step 2: Retrieve top_k similar books (excluding the reference book itself)
        similar_books = (
            Book.objects.exclude(id=reference_book.id)
            .annotate(distance=CosineDistance('embedding', reference_embedding))
            .filter(embedding__isnull=False)  # Ensure valid embeddings
            .order_by('distance')[:top_k]
        )

        if not similar_books:
            return "No similar books found at this time. Try browsing our catalog!"

        # Step 3: Format context for LLM
        context_lines = []
        for b in similar_books:
            author = b.author or "Unknown Author"
            description = b.description or "No description available."
            context_lines.append(f"Title: {b.title}\nAuthor: {author}\nDescription: {description}\n")

        context = "\n".join(context_lines)

        # Step 4: Generate recommendations using LLM
        try:
            llm = ChatOllama(model="deepseek-coder:1.3b", temperature=0.7, base_url=os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434'))
            prompt = ChatPromptTemplate.from_template(
                """You are a knowledgeable bookstore assistant. 
                    A customer enjoyed the book titled "{book_title}".

                    Here are some similar books from our catalog:

                    {context}

                    Recommend 3-5 books from the list above that this customer might enjoy next.
                    Explain briefly why each one is a good recommendation based on similarity to the original book.

                    Format your response as an HTML unordered list (<ul><li>...</li></ul>) with bold titles.
                    Do not recommend books outside this list."""
            )

            chain = prompt | llm | StrOutputParser()
            recommendation = chain.invoke({
                "book_title": book_title,
                "context": context
            })

            # Cache successful result for 1 hour
            cache.set(cache_key, recommendation, timeout=3600)
            return recommendation

        except Exception as llm_error:
            logger.error(f"LLM generation failed for book '{book_title}': {llm_error}")
            # Fallback: simple formatted list
            fallback = "<ul>"
            for b in similar_books:
                author = b.author or "Unknown Author"
                fallback += f"<li><strong>{b.title}</strong> by {author}</li>"
            fallback += "</ul>"
            return f"<p>You might also enjoy:</p>{fallback}"

    except Exception as e:
        logger.error(f"Unexpected error in recommendations for '{book_title}': {str(e)}")
        return "We're having trouble generating recommendations right now. Please try again later or browse our catalog."


def get_similar_books(query: str, top_k: int = 5):
    """
    Retrieve top_k similar books from the database using vector similarity.
    """
    model = get_sentence_transformer_model()
    query_embedding = model.encode(query).tolist()

    return (
        Book.objects.annotate(distance=CosineDistance('embedding', query_embedding))
        .filter(embedding__isnull=False)
        .order_by('distance')[:top_k]
    )



def get_reranked_books(query: str, top_k: int = 5, candidates_k: int = 20, enable_expansion: bool = True):
    """
    Retrieve candidate books via vector search and then re-rank them using a Cross-Encoder.
    Returns: List of Book objects (sorted by relevance)
    """
    import time
    func_start = time.time()
    candidates = []
    
    # 1. Get functional candidates (more than we need)
    if enable_expansion:
        try:
            expansion_start = time.time()
            from recommendations.expansion import expand_query
            variations = expand_query(query)
            expansion_duration = time.time() - expansion_start
            print(f"Query Expansion took {expansion_duration:.3f}s. Variations: {variations}", flush=True)
            
            seen_ids = set()
            
            vector_search_start = time.time()
            # Parallelize vector searches for all variations
            with ThreadPoolExecutor(max_workers=5) as executor:
                # Ensure variations are strings and not empty
                valid_variations = [str(v) for v in variations if v and str(v).strip()]
                
                future_to_query = {executor.submit(get_similar_books, q, top_k=candidates_k // 2): q for q in valid_variations}
                
                for future in future_to_query:
                    try:
                        results = future.result()
                        for book in results:
                            if book.id not in seen_ids:
                                candidates.append(book)
                                seen_ids.add(book.id)
                    except Exception as exc:
                        print(f"Search for '{future_to_query[future]}' generated an exception: {exc}", flush=True)

            vector_search_duration = time.time() - vector_search_start
            print(f"Vector Search (expanded) found {len(candidates)} unique candidates in {vector_search_duration:.3f}s", flush=True)

        except Exception as e:
            print(f"Expansion failed: {e}", flush=True)
            candidates = list(get_similar_books(query, top_k=candidates_k))
    else:
        vector_search_start = time.time()
        candidates = list(get_similar_books(query, top_k=candidates_k))
        print(f"Vector Search (single) took {time.time() - vector_search_start:.3f}s", flush=True)
    
    if not candidates:
        return []

    try:
        reranker_start = time.time()
        reranker = get_reranker_model()
        
        # 2. Prepare pairs for cross-encoding (Query, Document)
        # We use Title + Description for better context
        pairs = []
        for book in candidates:
            doc_text = f"{book.title}. {book.description or ''}"
            pairs.append([query, doc_text])
            
        # 3. Predict scores
        scores = reranker.predict(pairs)
        
        # 4. Attach scores and sort
        for i, book in enumerate(candidates):
            book.rerank_score = scores[i]
            
        # Sort descending by score
        candidates.sort(key=lambda x: x.rerank_score, reverse=True)
        
        reranker_duration = time.time() - reranker_start
        total_duration = time.time() - func_start
        print(f"Cross-Encoder Reranked {len(candidates)} books in {reranker_duration:.3f}s. Total get_reranked_books time: {total_duration:.3f}s", flush=True)
        return candidates[:top_k]
        
    except Exception as e:
        print(f"Reranking failed: {e}. Falling back to vector search.", flush=True)
        return candidates[:top_k]

def get_recommendation_prompt():
    return ChatPromptTemplate.from_template(
        """Books for query "{query}":
{context}

Return ONLY a JSON array of {count} short strings (1 sentence each) explaining why each book matches the query.
Example: ["Reason 1.", "Reason 2."]
JSON array:"""
    )

def get_recommendations_by_query_stream(query: str, top_k: int = 5):
    """
    Generate book recommendations based on a natural language query using vector similarity (RAG-style).
    Yields chunks of the LLM response for streaming.
    """
    import time
    overall_start = time.time()
    
    # Send an initial space to start the stream and keep connection alive
    yield " "

    # Check persistent cache first
    try:
        cache_check_start = time.time()
        cached_entry = SearchQueryCache.objects.filter(query__iexact=query).first()
        if cached_entry:
            print(f"Serving cached recommendations for: {query} (Cache check took {time.time() - cache_check_start:.3f}s)", flush=True)
            yield cached_entry.response
            return
    except Exception as e:
        print(f"Cache read error: {e}", flush=True)

    try:
        rerank_start = time.time()
        # Expansion disabled due to slow inference (84s with deepseek-r1, 53s with deepseek-coder)
        similar_books = get_reranked_books(query, top_k, enable_expansion=False)
        rerank_duration = time.time() - rerank_start
        
        count = len(similar_books)
        print(f"Stream: Found {count} similar books for query: '{query}' in {rerank_duration:.3f}s", flush=True)
        
        if not similar_books:
            yield "[]"
            return

        # Ultra-minimal context: just titles to minimize prefill tokens
        book_titles = ", ".join([f'"{b.title}"' for b in similar_books])
        
        llm_start = time.time()
        ollama_base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        
        # Ultra-minimal prompt with pre-seeded JSON to minimize prefill + output tokens
        # Pre-seeding '["' forces the model to continue the JSON array directly
        prompt_text = f'Why do these books match "{query}"? {book_titles}\nAnswer with a JSON array of {count} short reasons:\n["'
        
        print(f"Starting LLM generation for '{query}'...", flush=True)
        
        # Use Ollama REST API directly with think=false to disable deepseek-r1 thinking mode
        import urllib.request
        import json as _json
        
        payload = _json.dumps({
            "model": "deepseek-r1:1.5b",
            "prompt": prompt_text,
            "stream": False,
            "think": False,
            "options": {
                "num_predict": 60,    # ~12s at 5 tok/s
                "num_ctx": 256,       # Minimal context window = fastest prefill
                "temperature": 0.1
            }
        }).encode('utf-8')
        
        req = urllib.request.Request(
            f"{ollama_base_url}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=600) as resp:
            result = _json.loads(resp.read().decode('utf-8'))
            raw_response = result.get("response", "")
        
        llm_duration = time.time() - llm_start
        print(f"LLM completed for '{query}': {llm_duration:.3f}s", flush=True)
        
        # Reconstruct the full JSON: we pre-seeded '["' so prepend it back
        import re
        full_response = '["' + raw_response
        clean_response = re.sub(r'<think>.*?</think>', '', full_response, flags=re.DOTALL).strip()
        
        yield clean_response
        
        total_time = time.time() - overall_start
        print(f"Full request for '{query}' completed in {total_time:.3f}s (LLM: {llm_duration:.3f}s)", flush=True)

        # Cache the result after successful generation
        if clean_response and len(clean_response) > 10:
            try:
                SearchQueryCache.objects.get_or_create(query=query, defaults={'response': clean_response})
            except Exception as e:
                print(f"Failed to cache search query '{query}': {e}", flush=True)

    except Exception as e:
        print(f"Streaming failed: {e}", flush=True)
        yield f"Error: {str(e)}"

def get_recommendations_by_query(query: str, top_k: int = 5):
    """
    Generate book recommendations based on a natural language query using vector similarity (RAG-style).
    Includes secondary persistent cache check to avoid duplicate LLM runs.
    """
    stable_query = query.lower().strip()
    cache_key = f"recommendations_query_v5_{hashlib.md5(stable_query.encode()).hexdigest()}_{top_k}"
    cached_result = cache.get(cache_key)
    if cached_result:
        logger.info(f"Memory cache hit for: {stable_query}")
        return cached_result

    try:
        # Step 1: Check persistent database cache first!
        # This is the fastest way to avoid ANY work.
        persistent_entry = SearchQueryCache.objects.filter(query__iexact=query).first()
        
        similar_books = []
        response_text = None

        if persistent_entry:
            logger.info(f"Persistent cache hit for: {query}. Skipping LLM and heavy reranking.")
            response_text = persistent_entry.response
            # Use simple vector search for metadata (much faster/lighter than reranking)
            try:
                similar_books = get_similar_books(query, top_k)
            except Exception:
                similar_books = get_reranked_books(query, top_k)
        else:
            # Step 2: Get similar books (vector search + reranking)
            logger.info(f"Cache miss for: {query}. Performing full reranking search...")
            similar_books = get_reranked_books(query, top_k)
            if not similar_books:
                return []
            
            # Step 3: LLM generation
            logger.info(f"Running LLM generation for: {query}...")
            context = "\n".join([f"Title: {b.title}, Author: {b.author}, Description: {b.description}" for b in similar_books])
            
            llm = ChatOllama(model="deepseek-r1:1.5b", temperature=0.1, base_url=os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434'))
            prompt = get_recommendation_prompt()
            chain = prompt | llm | StrOutputParser()
            
            response_text = chain.invoke({"query": query, "context": context})
            
            # Save to persistent cache
            if response_text and len(response_text) > 10:
                 SearchQueryCache.objects.get_or_create(query=query, defaults={'response': response_text})

        import json
        def robust_json_parse(text):

            try:
                clean = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
                clean = clean.replace("```json", "").replace("```", "").strip()
                match = re.search(r'\[.*\]', clean, re.DOTALL)
                if match: clean = match.group(0)
                if clean.startswith('[') and not clean.endswith(']'):
                    if not clean.endswith('"'): clean += '"'
                    clean += ']'
                return json.loads(clean)
            except Exception:
                return None

        reasons = robust_json_parse(response_text)
        if reasons is None:
            logger.warning(f"Failed to parse LLM JSON: {response_text}")
            reasons = ["Highly relevant matching based on your query." for _ in similar_books]

        if len(reasons) < len(similar_books):
            reasons.extend(["A great match for your interests." for _ in range(len(similar_books) - len(reasons))])

        # Build a reference -> Product ID lookup for the selected books
        from store.models import Product
        book_references = [b.reference for b in similar_books if b.reference]
        product_map = {}
        if book_references:
            products = Product.objects.filter(reference__in=book_references).values_list('reference', 'id')
            product_map = {ref: pid for ref, pid in products}

        structured_recommendations = []
        for i, book in enumerate(similar_books):
            structured_recommendations.append({
                'title': book.title,
                'author': book.author,
                'description': book.description,
                'reference': book.reference,
                'product_id': product_map.get(book.reference),
                'reason': reasons[i] if i < len(reasons) else "A great choice."
            })

        cache.set(cache_key, structured_recommendations, timeout=3600)
        return structured_recommendations

    except Exception as e:
        logger.error(f"Unexpected error in query recommendations: {str(e)}")
        return []
        
def search_books(query: str, top_k: int = 5):
    """
    Search for books using vector similarity.
    Returns: QuerySet of Book objects
    """
    try:
        from recommendations.hyde import generate_hyde_embedding
        query_embedding = generate_hyde_embedding(query)
        
        similar_books = (
            Book.objects.annotate(distance=CosineDistance('embedding', query_embedding))
            .filter(embedding__isnull=False)
            .order_by('distance')[:top_k]
        )
        return similar_books
    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        return Book.objects.none()