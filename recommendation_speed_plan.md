# Analysis and Plan to Speed Up Book Recommendations

## 1. Analysis Findings
The current recommendation system (RAG) is slow (~10-15 seconds) due to several sequential bottlenecks:
1.  **Query Expansion**: Uses an LLM to generate search variations (2-4s).
2.  **HyDE (Hypothetical Document Embeddings)**: Uses an LLM to generate a fake book description (3-5s).
3.  **Cross-Encoder Reranking**: Re-ranks results for accuracy but adds overhead (1-2s).
4.  **LLM Reasoning**: Generates the "why" for each recommendation (5-8s).

When the cache is empty, these steps happen one after another, leading to high latency.

## 2. Speed Optimization Plan (TDD Based)

### Phase 1: Establish Performance Benchmarks (TDD)
- [ ] Create `performance_benchmark.py` to measure the current latency of each step.
- [ ] Define success criteria: Streaming results in < 2s, complete results in < 5s.

### Phase 2: Implementation of Optimizations
- **A. Parallelize LLM Calls**: Use asynchronous programming or threading to run expansion and initial searches concurrently.
- **B. Use Faster Models**: Swap `deepseek-r1:1.5b` for lighter models like `phi3:mini` or `tinyllama` for pre-processing tasks (expansion/HyDE).
- **C. Implement a "Fast Path"**: Skip expansion and reranking for simple keyword-based queries.
- **D. Selective HyDE**: Only use HyDE when initial vector search results have low similarity scores.

### Phase 3: Verification
- [ ] Re-run benchmarks to confirm performance gains.
- [ ] Verify recommendation relevance remains high.

## 3. Tasks to Complete
1. [ ] **Benchmark Current Performance**: Measure baseline latency.
2. [ ] **Optimize Query Expansion**: Parallelize or use a faster model.
3. [ ] **Optimize Recommendation Generation**: Stream response more aggressively and use async calls.
4. [ ] **Implement Smart Caching**: Cache expanded query embeddings.
5. [ ] **Fast Path Logic**: Add logic to bypass complex steps for simple queries.
