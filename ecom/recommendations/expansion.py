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
        llm = ChatOllama(model="deepseek-r1:1.5b", temperature=0.7, base_url=os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434'))
        
        prompt = ChatPromptTemplate.from_template(
            """You are a helpful search assistant.
               Generate {num} different search queries based on this user input: "{query}".
               Include synonyms, related sub-genres, or specific themes.
               
               Return ONLY a JSON array of strings.
               Example: ["original query", "synonym 1", "related theme"]
               
               Do not explain. Just JSON.
            """
        )
        
        chain = prompt | llm | StrOutputParser()
        response = chain.invoke({"query": query, "num": num_variations})
        
        # Clean up response
        clean_json = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL)
        clean_json = clean_json.replace("```json", "").replace("```", "").strip()
        
        variations = json.loads(clean_json)
        
        # Always include the original query if not present
        if query not in variations:
            variations.insert(0, query)
            
        logger.info(f"Expanded '{query}' to: {variations}")
        return variations[:5] # Limit to reasonable number
        
    except Exception as e:
        logger.error(f"Query expansion failed: {e}")
        return [query]
