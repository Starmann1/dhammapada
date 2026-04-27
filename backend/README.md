# Dhammapada FastAPI Service

This service exposes a read-only API for the Dhammapada frontend and a future MongoDB-backed content platform.

## Run Locally

1. Create and activate a virtual environment.
2. Install dependencies:

   ```bash
   pip install -r backend/requirements.txt
   ```

3. Start the API:

   ```bash
   uvicorn backend.app.main:app --reload
   ```

The API works immediately against `data/dhammapada.json` without MongoDB.

## Structured Hybrid RAG Chatbot

The RAG implementation uses MongoDB Atlas Vector Search when MongoDB contains verse embeddings and the configured vector index is available. It falls back to the in-memory local retriever when Vector Search is not configured, so local development still works.

### Endpoints

```http
GET /api/rag/search?q=hatred&limit=5
```

Returns verse-level retrieval matches using hybrid scoring. The response shape matches the existing search result model.

```http
POST /api/chat
Content-Type: application/json

{
  "question": "How should I deal with anger?",
  "limit": 5
}
```

Returns a grounded answer with verse citations, retrieval scores, themes, slugs, translations, excerpts, and source references.

When `LLM_PROVIDER=openai` and `OPENAI_API_KEY` are set, `/api/chat` sends the retrieved verse context to the OpenAI Responses API for a natural-language answer. Without those variables, it returns a deterministic citation-grounded summary.

### Retrieval Strategy

- Each Dhammapada verse is indexed as a complete structured record rather than arbitrary text chunks.
- Retrieval combines MongoDB Atlas Vector Search with MongoDB text search.
- Local development falls back to lexical matching with local TF-IDF cosine similarity.
- Ranking uses a weighted hybrid score from lexical and semantic signals.
- Direct verse references such as `Dhammapada 1:1` resolve to that verse.
- Answers are citation-grounded and generated from retrieved verse translations and commentary.

### Seeding Embeddings

The seed script stores `rag_text`, `chapter_local_number`, `embedding_provider`, and `embedding` on each verse document:

```bash
python backend/seed_mongodb.py
```

For immediate development, use deterministic local embeddings:

```env
EMBEDDING_PROVIDER=local
EMBEDDING_DIMENSIONS=384
```

For production-quality semantic retrieval, use OpenAI embeddings and create the MongoDB Atlas Vector Search index with the same dimensions:

```env
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
OPENAI_API_KEY=your_key
MONGODB_VECTOR_SEARCH_INDEX=verse_vector_index
```

Example Atlas Vector Search index:

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

Set `numDimensions` to `1536` when using the OpenAI configuration above.

### LLM Answer Generation

Enable the LLM layer after MongoDB retrieval is working:

```env
LLM_PROVIDER=openai
LLM_MODEL=gpt-4.1-mini
OPENAI_API_KEY=your_key
```

Then restart FastAPI:

```bash
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001
```

Check `/api/rag/status`; `llm_enabled` should be `true`. The LLM prompt only treats retrieved Dhammapada passages as authoritative. Comparative questions, such as comparisons with Advaita Vedanta, are allowed only in a clearly separated comparative note.

## MongoDB

Set environment variables from `backend/.env.example`, then seed the database:

```bash
python backend/seed_mongodb.py
```

When `MONGODB_URI` is present, the API will prefer MongoDB and fall back to the JSON dataset only if a document is missing.
