from __future__ import annotations

import time

from pymongo import MongoClient
from pymongo.errors import OperationFailure
from pymongo.operations import SearchIndexModel

from app.config import settings


def main() -> None:
    if not settings.mongodb_uri:
        raise SystemExit("Set MONGODB_URI before creating the vector search index.")

    client = MongoClient(settings.mongodb_uri)
    database = client[settings.mongodb_database]
    collection = database.verses

    definition = {
        "fields": [
            {
                "type": "vector",
                "path": "embedding",
                "numDimensions": settings.embedding_dimensions,
                "similarity": "cosine",
            },
            {
                "type": "filter",
                "path": "chapter_id",
            },
            {
                "type": "filter",
                "path": "themes",
            },
        ]
    }

    existing_indexes = list(collection.list_search_indexes())
    existing_index = next((item for item in existing_indexes if item.get("name") == settings.vector_search_index), None)
    if existing_index:
        print(f"Vector Search index '{settings.vector_search_index}' already exists.")
        print("If you changed EMBEDDING_DIMENSIONS, delete and recreate the index in Atlas.")
        return

    try:
        model = SearchIndexModel(
            definition=definition,
            name=settings.vector_search_index,
            type="vectorSearch",
        )
        collection.create_search_index(model=model)
    except OperationFailure as error:
        raise SystemExit(
            "Could not create the Vector Search index automatically. "
            "This usually means your cluster tier or MongoDB/Atlas permissions do not allow search index creation. "
            f"Atlas error: {error}"
        ) from error

    print(
        f"Requested Vector Search index '{settings.vector_search_index}' "
        f"on {settings.mongodb_database}.verses with {settings.embedding_dimensions} dimensions."
    )
    print("Waiting briefly for Atlas to report the index state...")

    for _ in range(12):
        time.sleep(5)
        indexes = list(collection.list_search_indexes())
        index = next((item for item in indexes if item.get("name") == settings.vector_search_index), None)
        status = index.get("status") or index.get("queryable") if index else "not found"
        print(f"Index status: {status}")
        if index and (index.get("queryable") is True or index.get("status") == "READY"):
            return

    print("Index creation was requested. It may still be building in Atlas.")


if __name__ == "__main__":
    main()
