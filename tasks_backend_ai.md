# Backend & AI Architecture Tasks

Based on `PROJECT_IMPROVEMENTS.md`, here is the list of pending tasks for Backend & AI Architecture:

- [x] **Advanced RAG Techniques**
  - [x] **Re-ranking:** Implement a cross-encoder model (e.g., `BAAI/bge-reranker` or `cross-encoder/ms-marco-MiniLM-L-6-v2`) to re-rank the top-K results from the vector search before sending them to the LLM.
    - *Goal:* Improve relevance of search results passed to the LLM.
    - *Implementation:* Added `CrossEncoder` to `rag.py` and updated `get_recommendations_by_query` to re-rank candidates.
  - [x] **HyDE (Hypothetical Document Embeddings):** Generate a hypothetical answer first, embed that, and search against it.
    - *Goal:* Improve semantic matching for complex queries.
    - *Implementation:* Added `generate_hyde_embedding` in `hyde.py` and updated `search_books` to use it.
  - [x] **Query Expansion:** Use the LLM to generate synonyms or related questions.
    - *Goal:* Broaden the search scope.
    - *Implementation:* Added `expand_query` in `expansion.py` and updated `get_reranked_books` to use it.

- [x] **Asynchronous Processing**
  - [x] Offload heavy tasks (generating vector embeddings for bulk uploads, sending emails) to a task queue.
    - *Implementation:* Created `recommendations/tasks.py` for embeddings (triggered by signals) and `store/tasks.py` for emails.
  - [x] Implement **Celery** with **Redis** or **RabbitMQ**.
    - *Implementation:* Added `redis` service to `docker-compose.yml`, configured `celery` in `ecom/celery.py` and `settings.py`.

- [x] **API Gateway**
  - [x] Introduce an API Gateway (like **Kong** or advanced K8s Ingress definitions).
  - *Goal:* Handle rate limiting, authentication, and request validation at the edge.
  - *Implementation:* Created `k8s-manifests/api-gateway-ingress.yaml` with Nginx Ingress annotations for Rate Limiting (5rps/IP), CORS, and Body Size Limits. Requires `minikube addons enable ingress`.
