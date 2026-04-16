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

## MongoDB

Set environment variables from `backend/.env.example`, then seed the database:

```bash
python backend/seed_mongodb.py
```

When `MONGODB_URI` is present, the API will prefer MongoDB and fall back to the JSON dataset only if a document is missing.
