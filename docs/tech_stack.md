# Technology Stack & Resources

This document provides a comprehensive list of all open-source libraries, frameworks, resources, and tools used in the development of the Dhammapada platform.

(AS OF APRIL 30th, 2026 - Version 1.0)
---

### 1. Backend AI Engine (Python Stack)
*   **FastAPI**: The high-performance web framework used to build the Dhamma AI API. It handles the logic for the RAG (Retrieval-Augmented Generation) pipeline.
*   **Uvicorn**: The lightning-fast ASGI server that runs the FastAPI backend.
*   **PyMongo [srv]**: The official driver used to connect the application to MongoDB Atlas for both traditional queries and advanced Vector Search.
*   **Python-Dotenv**: Manages sensitive API keys and database credentials securely via `.env` files.
*   **Standard Python Libraries**:
    *   `hashlib` & `math`: Used for the custom **Sign-Hashing Vectorizer** that creates local embeddings.
    *   `urllib`: Used to perform direct, lightweight REST API calls to Groq and OpenAI without adding heavy SDK dependencies.

### 2. Frontend & Design (UI/UX)
*   **Vanilla JavaScript (ES6+)**: The entire frontend logic—including the dynamic page loading, search modal, and side-panel AI chat—is built with pure JS to ensure zero "framework bloat" and instant loading.
*   **Vanilla CSS3**: A custom design system utilizing:
    *   **Glassmorphism**: For the blurred, translucent navigation bars and modals.
    *   **CSS Variables**: For the seamless "Dark Mode" and "Light Mode" theme engine.
    *   **Flexbox & CSS Grid**: For the responsive chapter and verse layouts.
*   **Google Fonts API**:
    *   **Inter**: Used for the UI and general reading text (highly legible).
    *   **Crimson Text**: A classic serif font used specifically for the **Pali Text** to give it a traditional, scriptural feel.
    *   **Playfair Display**: Used for bold, elegant headers.
*   **SVG (Scalable Vector Graphics)**: All icons (Search, Moon/Sun, Navigation arrows) are custom-coded SVGs for infinite sharpness and zero file size.

### 3. Data & Scholarly Resources (The "Source of Truth")
*   **[SuttaCentral](https://suttacentral.net)**: The definitive source for the **Pali Root Text** and the modern English translations by **Bhikkhu Sujato**.
*   **[Ancient Buddhist Texts](https://ancient-buddhist-texts.net/Texts-and-Translations/Dhammapada/index.htm)**: Data for interlinear word-by-word meanings and commentary notes was meticulously sourced from the scholarly edition of *Dhammapada: Annotated Pali Text and Translation* (by Ānandajoti Bhikkhu).
*   **[Tipitaka.net](https://www.tipitaka.net)**: The source for the traditional **Dhammapada Atthakatha** (Stories and Commentaries).

### 4. Infrastructure & AI Providers
*   **MongoDB Atlas**: The cloud database that hosts the verses and provides the **HNSW (Hierarchical Navigable Small World)** vector index for semantic search.
*   **Groq Cloud**: Provides the **Llama-3-70b** model for the AI's "brain," allowing it to explain complex Buddhist concepts in milliseconds.
*   **Vercel**: The deployment platform that hosts both the static frontend and the serverless Python backend.
*   **Git**: Used for version control and managing the project's evolution.

### 5. Developer Tools
*   **VS Code**: The primary IDE used for development.
*   **Postman / Thunder Client**: Used for testing the API endpoints during the RAG implementation.
*   **Python Venv**: Used to isolate the backend environment and keep dependencies clean.
*   **Node.js**: Used to run data enrichment and preprocessing scripts (like `enrich-data.mjs`) to compile the final JSON dataset.
