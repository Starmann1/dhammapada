import json
from pathlib import Path
import sys
import os

# Setup paths to allow imports from the backend package
project_root = Path(__file__).resolve().parents[0].parents[0]
sys.path.append(str(project_root))

from backend.app.repository import get_repository
from backend.app.rag import StructuredHybridRag
from backend.app.config import settings

def main():
    dataset_path = Path("backend/tests/golden_dataset.json")
    if not dataset_path.exists():
        print(f"Error: Dataset not found at {dataset_path}")
        return

    with open(dataset_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    repository = get_repository()
    rag = StructuredHybridRag(repository)

    print(f"--- Dhamma AI Accuracy Test ---")
    print(f"Repository: {repository.repository_name}")
    print(f"Embedding Provider: {rag.embedding_provider.name}")
    print(f"Dataset size: {len(dataset)} queries\n")

    stats = {
        "Direct": {"total": 0, "hits": 0},
        "Semantic": {"total": 0, "hits": 0},
        "Complex": {"total": 0, "hits": 0},
    }

    for case in dataset:
        query = case["query"]
        expected = set(case["expected_ids"])
        tier = case["tier"]

        print(f"Testing [{tier}] Query: {query}")

        # Test Retrieval
        results = rag.search(query, limit=5)
        retrieved_ids = {r.verse["id"] for r in results}

        # A 'hit' is defined as at least one expected ID being in the top 5
        is_hit = any(eid in retrieved_ids for eid in expected)

        if is_hit:
            print(f"  [HIT] Found: {retrieved_ids.intersection(expected)}")
        else:
            print(f"  [MISS] Top results: {list(retrieved_ids)[:3]}")

        stats[tier]["total"] += 1
        if is_hit:
            stats[tier]["hits"] += 1

    print("\n--- Final Accuracy Report ---")
    for tier, data in stats.items():
        accuracy = (data["hits"] / data["total"] * 100) if data["total"] > 0 else 0
        print(f"{tier:8}: {accuracy:5.1f}% ({data['hits']}/{data['total']})")

if __name__ == "__main__":
    main()
