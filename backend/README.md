# Dhammapada FastAPI Service

This service exposes a read-only API for the Dhammapada platform, providing advanced search and an AI-powered study assistant.

## Run Locally

All commands below should be run from the **Project Root** directory.

1. **Set up Environment**:
   Create and activate a virtual environment, then install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Configuration**:
   Ensure your `backend/.env` file is configured. By default, the project is set to use **Groq** for AI answers and **Local Hashing** for embeddings to ensure zero-cost development.

3. **Start the API**:
   ```bash
   python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001
   ```

The API works immediately against `data/dhammapada.json`. If MongoDB is configured, it will automatically prefer cloud data.

## Structured Hybrid RAG Chatbot

The RAG (Retrieval-Augmented Generation) engine provides context-aware answers grounded in the scriptures.

### Key Endpoints

#### 1. Hybrid Search
```http
GET /api/search?q=mindfulness&limit=5
```
Returns verse-level matches using a hybrid of Vector Search and Lexical Search. Note: Specific references like `18:2` will return only that single verse.

#### 2. Dhamma AI Chat
```http
POST /api/chat
Content-Type: application/json

{
  "question": "What does Buddha say about anger?",
  "limit": 5
}
```
Returns a grounded answer with citations. The AI is restricted to only use the retrieved Dhammapada verses as its source of truth.

### Retrieval Strategy

- **Hybrid Scoring**: Combines MongoDB Atlas Vector Search (Semantic) with Text Search (Lexical) using a weighted formula.
- **Local Fallback**: If MongoDB is unreachable, the system automatically falls back to a local TF-IDF vectorizer and the `dhammapada.json` file.
- **Direct Lookup**: Verse references (e.g., `1:1`) bypass the AI search for 100% precision.

### Seeding Data

To populate your MongoDB Atlas cluster with verses and embeddings:

```bash
python backend/seed_mongodb.py
```

### AI Configuration (.env)

The system is optimized for the following setup:

```env
# AI Intelligence (Groq)
LLM_PROVIDER=groq
LLM_MODEL=llama-3.3-70b-versatile
GROQ_API_KEY=your_key

# Search (Local Hashing - No API Key required)
EMBEDDING_PROVIDER=local
EMBEDDING_DIMENSIONS=384
```

To upgrade to **OpenAI** for production-grade semantic retrieval:
1. Set `EMBEDDING_PROVIDER=openai` and `OPENAI_API_KEY`.
2. Update `EMBEDDING_DIMENSIONS=1536`.
3. Re-run the seed script and update your Atlas Vector Search index.

## MongoDB Vector Index

If using MongoDB Atlas, create a search index named `verse_vector_index` with the following configuration:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 384,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "chapter_id"
    },
    {
      "type": "filter",
      "path": "themes"
    }
  ]
}
```

*Note: Change `numDimensions` to `1536` if switching to OpenAI embeddings.*
