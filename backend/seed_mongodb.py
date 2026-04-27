from __future__ import annotations

import json
from pathlib import Path

from pymongo import MongoClient

from app.config import settings
from app.embeddings import EmbeddingProvider, build_rag_text


def main() -> None:
    if not settings.mongodb_uri:
        raise SystemExit("Set MONGODB_URI before running the seed script.")

    data = json.loads(Path(settings.data_file).read_text(encoding="utf-8"))
    client = MongoClient(settings.mongodb_uri)
    database = client[settings.mongodb_database]
    embedding_provider = EmbeddingProvider()

    chapters = []
    verses = []
    for chapter in data["chapters"]:
        chapter_doc = {key: value for key, value in chapter.items() if key != "verses"}
        chapter_doc["verse_count"] = len(chapter["verses"])
        chapters.append(chapter_doc)
        for chapter_index, verse in enumerate(chapter["verses"], start=1):
            verse_doc = dict(verse)
            verse_doc["chapter_local_number"] = chapter_index
            verse_doc["rag_text"] = build_rag_text(verse_doc)
            verse_doc["embedding_provider"] = embedding_provider.name
            verse_doc["embedding"] = embedding_provider.embed(verse_doc["rag_text"])
            verses.append(verse_doc)

    database.chapters.delete_many({})
    database.verses.delete_many({})
    database.site_content.delete_many({})

    if chapters:
        database.chapters.insert_many(chapters)
    if verses:
        database.verses.insert_many(verses)

    site_content_keys = [
        "site",
        "about",
        "faqs",
        "quotes",
        "characters",
        "theme_definitions",
        "featured_verse_ids",
        "verse_of_the_day_seed",
    ]
    for key in site_content_keys:
        database.site_content.insert_one({"key": key, "value": data[key]})

    database.chapters.create_index("id", unique=True)
    database.verses.create_index([("chapter_id", 1), ("verse_number", 1)], unique=True)
    database.verses.create_index("id", unique=True)
    database.verses.create_index([("chapter_id", 1), ("chapter_local_number", 1)], unique=True)
    database.verses.create_index("themes")
    database.site_content.create_index("key", unique=True)
    database.verses.create_index(
        [
            ("translation", "text"),
            ("pali", "text"),
            ("transliteration", "text"),
            ("commentary", "text"),
            ("story.title", "text"),
            ("story.content", "text"),
        ],
        weights={
            "translation": 10,
            "pali": 8,
            "transliteration": 7,
            "commentary": 4,
            "story.title": 3,
            "story.content": 2,
        },
    )

    counts = {
        "chapters": database.chapters.count_documents({}),
        "verses": database.verses.count_documents({}),
        "site_content": database.site_content.count_documents({}),
    }
    expected_counts = {
        "chapters": len(chapters),
        "verses": len(verses),
        "site_content": len(site_content_keys),
    }
    if counts != expected_counts:
        raise SystemExit(
            "Seed validation failed: "
            f"expected {expected_counts}, got {counts}."
        )

    print(
        f"Seeded MongoDB database '{settings.mongodb_database}' with "
        f"{counts['chapters']} chapters, {counts['verses']} verses, and "
        f"{counts['site_content']} site content documents."
    )


if __name__ == "__main__":
    main()
