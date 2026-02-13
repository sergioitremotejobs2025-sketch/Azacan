import os
import re
import logging
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from recommendations.rag import get_sentence_transformer_model

logger = logging.getLogger(__name__)

def generate_hyde_embedding(query: str):
    """
    Generate a Hypothetical Document Embedding (HyDE).
    1. Use LLM to generate a hypothetical answer/book description for the query.
    2. Embed that hypothetical text.
    """
    try:
        llm = ChatOllama(model="deepseek-r1:1.5b", temperature=0.7, base_url=os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434'))
        prompt = ChatPromptTemplate.from_template(
            """You are a helpful book expert.
               Write a short, detailed description (3-4 sentences) of a hypothetical book that would perfectly answer this query: "{query}".
               Do not mention real books. Focus on the plot, themes, and style.
            """
        )
        chain = prompt | llm | StrOutputParser()
        hypothetical_doc = chain.invoke({"query": query})
        
        # Clean up any think blocks
        hypothetical_doc = re.sub(r'<think>.*?</think>', '', hypothetical_doc, flags=re.DOTALL).strip()
        
        logger.info(f"HyDE generated: {hypothetical_doc[:100]}...")
        
        model = get_sentence_transformer_model()
        embedding = model.encode(hypothetical_doc).tolist()
        return embedding
        
    except Exception as e:
        logger.error(f"HyDE generation failed: {e}")
        # Fallback to normal query embedding
        model = get_sentence_transformer_model()
        return model.encode(query).tolist()
