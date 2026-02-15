import os
import json
import logging
import re
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

logger = logging.getLogger(__name__)

def expand_query(query: str, num_variations: int = 3) -> list[str]:
    """
    Expand a user query into multiple variations to improve search recall.
    """
    try:
        # Use a faster, lighter model for pre-processing tasks like expansion
        llm = ChatOllama(model="DeepSeek-Coder:latest", temperature=0.7, base_url=os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434'))
        
        prompt = ChatPromptTemplate.from_template(
            """Generate {num} search query variations for: "{query}".
               Output ONLY a JSON array of strings. No explanation.
               Example: ["term 1", "term 2"]
            """
        )
        
        chain = prompt | llm | StrOutputParser()
        response = chain.invoke({"query": query, "num": num_variations})
        
        # Clean up response (robust cleaning)
        clean_json = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL)
        clean_json = clean_json.replace("```json", "").replace("```", "").strip()
        
        # Extract [...] if the model added extra text
        match = re.search(r'\[.*\]', clean_json, re.DOTALL)
        if match:
            clean_json = match.group(0)
            
        try:
            variations = json.loads(clean_json)
        except json.JSONDecodeError:
            # Fallback: try to find strings in quotes if JSON fails
            variations = re.findall(r'"([^"]*)"', clean_json)
        
        if not isinstance(variations, list):
            variations = [query]
            
        # Ensure all items are strings (handles list of dicts or other types)
        final_variations = []
        for item in variations:
            if isinstance(item, str):
                final_variations.append(item)
            elif isinstance(item, dict):
                # If model returned keys like {"text": "..."}, extract the value
                val = next(iter(item.values())) if item else None
                if isinstance(val, str):
                    final_variations.append(val)
        
        variations = final_variations if final_variations else [query]
            
        # Ensure original is there
        if query not in variations:
            variations.insert(0, query)
            
        logger.info(f"Expanded '{query}' to: {variations[:5]}")
        return [str(v) for v in variations[:5]]
        
    except Exception as e:
        logger.error(f"Query expansion failed: {e}")
        return [query]
