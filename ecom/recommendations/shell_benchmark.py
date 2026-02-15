import time
import logging
from recommendations.rag import get_recommendations_by_query, get_recommendations_by_query_stream

# Disable detailed logging
logging.disable(logging.WARNING)

def benchmark_query(query, top_k=5):
    print(f"\n{'='*50}")
    print(f"Benchmarking Query: '{query}'")
    print(f"{'='*50}")

    # 1. Benchmark Blocking (Non-streaming)
    start_time = time.time()
    try:
        results = get_recommendations_by_query(query, top_k=top_k)
        duration = time.time() - start_time
        print(f"Non-streaming completion: {duration:.2f}s")
        print(f"Number of recommendations: {len(results)}")
    except Exception as e:
        print(f"Non-streaming failed: {e}")
        duration = 0

    # 2. Benchmark Streaming
    print("\nStreaming start:")
    start_time = time.time()
    try:
        stream = get_recommendations_by_query_stream(query, top_k=top_k)
        
        first_chunk_time = None
        full_content = ""
        
        for chunk in stream:
            if first_chunk_time is None:
                first_chunk_time = time.time() - start_time
                print(f"  Time to first chunk: {first_chunk_time:.2f}s")
            full_content += chunk
        
        total_stream_time = time.time() - start_time
        print(f"Streaming completion: {total_stream_time:.2f}s")
    except Exception as e:
        print(f"Streaming failed: {e}")
        first_chunk_time = 0
        total_stream_time = 0
    
    return {
        "query": query,
        "non_streaming_duration": duration,
        "first_chunk_time": first_chunk_time,
        "total_stream_time": total_stream_time
    }

queries = [
    "Sci-fi books with space travel",
    "Mystery novels set in London"
]

results = []
for q in queries:
    results.append(benchmark_query(q))

# Summary Table
print("\n\n" + "="*80)
print(f"{'Query':<40} | {'First Chunk':<12} | {'Total Stream':<12} | {'Non-Stream':<12}")
print("-" * 80)
for res in results:
    print(f"{res['query'][:40]:<40} | {res['first_chunk_time'] or 0:>10.2f}s | {res['total_stream_time']:>10.2f}s | {res['non_streaming_duration']:>10.2f}s")
print("="*80)
exit()
