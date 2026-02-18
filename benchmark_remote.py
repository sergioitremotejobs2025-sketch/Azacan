import requests
import time
import sys

BACKEND_URL = "http://136.112.132.41:8000/api/recommend/query/stream/"

def benchmark_query(query):
    print(f"\nBenchmarking: '{query}'")
    start_time = time.time()
    
    try:
        # Use stream=True to measure TTFT
        with requests.post(BACKEND_URL, json={"query": query}, stream=True, timeout=60) as r:
            if r.status_code != 200:
                print(f"Error: {r.status_code} - {r.text}")
                return

            first_byte_time = None
            total_content_length = 0
            
            for chunk in r.iter_content(chunk_size=1024):
                if first_byte_time is None:
                    first_byte_time = time.time() - start_time
                    print(f"  > Time to First Token (TTFT): {first_byte_time:.2f}s")
                
                if chunk:
                    total_content_length += len(chunk)

            total_time = time.time() - start_time
            print(f"  > Total Duration: {total_time:.2f}s")
            print(f"  > Total Content Received: {total_content_length} bytes")

    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    queries = [
        "amor", 
        "Science Fiction about space", 
        "History of Rome",
        "Artificial Intelligence ethics"
    ]
    
    print(f"Targeting: {BACKEND_URL}")
    for q in queries:
        benchmark_query(q)
        time.sleep(2) # cool down
