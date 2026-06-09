# 📘 Project Experience: Libro-Mind (AI-Powered Bibliographic Discovery)

**Role:** Full Stack Software Engineer / AI Architect  
**Technologies:** React, Next.js 16, TypeScript, Python, Django, PostgreSQL, pgvector, LangChain, Ollama, Docker, Kubernetes (Minikube & GKE), Terraform, GitHub Actions, Jest, Playwright.  

### 🚀 Project Overview
Designed and developed **Libro-Mind**, a highly scalable microservices-based recommendation engine. The application utilizes a Retrieval-Augmented Generation (RAG) pipeline and local Large Language Models (LLMs) to allow users to discover books using complex, natural-language semantic searches instead of traditional keyword matching.

### 💡 Key Achievements & Responsibilities
* **Microservices Architecture & API Gateway:** Architected a 5-tier microservices ecosystem separating the Next.js React frontend, a Django Python API Gateway, a JSON-Server auth mock, a PostgreSQL persistent storage layer, and a dedicated AI inference container.
* **AI & RAG Pipeline Implementation:** Integrated `SentenceTransformers` to convert a 9,800+ book catalog into mathematical embeddings stored in PostgreSQL via the `pgvector` extension. Constructed a RAG pipeline utilizing LangChain and local DeepSeek models (via Ollama) to stream personalized, token-by-token recommendations.
* **Test-Driven Development (TDD):** Established a rigorous testing culture, achieving extensive coverage (51+ tests) across both the backend and frontend. Wrote comprehensive Jest component tests (with mocked hooks and Axios requests) and Playwright End-to-End browser tests for the React frontend, alongside extensive Django unit tests for the eCommerce logic and AI engine.
* **Cloud & Infrastructure as Code:** Engineered cross-platform deployment solutions. Built local developer environments using automated bash scripts on Minikube, and production-grade deployments on Google Kubernetes Engine (GKE) utilizing Terraform and Workload Identity Federation.
* **Performance Optimization & Debugging:** Diagnosed and resolved complex distributed system issues, including recovering PostgreSQL from severe storage exhaustion ("No space left on device"), implementing persistent database caching (`SearchQueryCache`) to bypass slow CPU-bound LLM generation timeouts, and resolving intricate local port-forwarding network mismatch issues.
* **CI/CD & DevOps:** Configured fully automated GitHub Actions pipelines to securely build Docker images, run test suites, and deploy directly to Google Artifact Registry and GKE clusters without managing static SSH keys.
