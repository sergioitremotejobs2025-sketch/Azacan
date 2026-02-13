# Libro-Mind: AI-Powered E-commerce Platform with RAG

## Project Overview
Designed and engineered a hybrid e-commerce platform that modernizes a traditional bookstore architecture with cutting-edge Generative AI capabilities. The system leverages **Retrieval-Augmented Generation (RAG)** to provide semantic search and real-time, context-aware book recommendations, bridging the gap between open-ended discovery and transactional commerce.

## Key Technologies
- **Backend:** Python, Django 5.2, Django REST Framework
- **Frontend:** TypeScript, Next.js 16.1 (App Router), Tailwind CSS
- **AI & ML:** Ollama (DeepSeek-R1 1.5B), LangChain, SentenceTransformers, PyTorch
- **Database:** PostgreSQL 15 with **pgvector** extension (vector similarity search)
- **Infrastructure:** Kubernetes (K8s), Istio (Service Mesh), Helm v3, Docker, GitHub Actions (CI/CD), GCP, Terraform
- **Observability:** Prometheus, Kiali, Jaeger

## Core Features & Contributions
- **Cloud-Native Architecture:** Architected and deployed a multi-tier microservices ecosystem on Kubernetes, managing lifecycle and inter-service communication for Django, Next.js, Ollama, and JSON-Server.
- **Service Mesh Implementation (Istio):** Integrated **Istio** to manage traffic routing, implement secure inter-service mTLS communication, and gain deep observability into the network topography.
- **Advanced Helm Charting:** Engineered a modular **Helm Chart v3** with sub-chart dependencies (Bitnami PostgreSQL), dynamic environment configurations, and unified deployment templates for AI and Web services.
- **Horizontal Pod Autoscaling (HPA):** Implemented automated scaling policies based on real-time CPU and Memory utilization, ensuring system responsiveness under variable load for both the Next.js frontend and AI-heavy backend.
- **Semantic Search & RAG Engine:** Implemented a vector search system using `pgvector` and `all-MiniLM-L6-v2` embeddings to understand user intent beyond simple keyword matching.
- **Real-Time AI Streaming:** Engineered a low-latency streaming pipeline delivering LLM-generated insights token-by-token to the UI, reducing perceived latency significantly.
- **Observability Stack:** Deployed a full observability suite using **Prometheus**, **Kiali**, and **Jaeger** to monitor traffic flows, identify service bottlenecks, and visualize distributed traces across the AI pipeline.

## Technical Challenges Solved
- **K8s Startup & Race Conditions:** Resolved complex pod startup failures in the service mesh by optimizing readiness/liveness probes and implementing initialization delays to handle model loading (SentenceTransformers) and schema migrations concurrently.
- **Service Mesh Connectivity:** Debugged and fixed inter-service communication issues post-Istio integration by standardizing service port naming and configuring outbound traffic policies to handle external AI model downloads.
- **Resource Management for AI Workloads:** Optimized pod resource requests and limits to handle memory-intensive PyTorch and LLM (Ollama) operations within a resource-constrained Minikube/GKE environment.
- **Database Consistency:** Resolved integrity issues between the vector database and transactional database using a reference-based mapping system.
