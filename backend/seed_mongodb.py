from __future__ import annotations

import json
from pathlib import Path

from pymongo import MongoClient

from app.config import settings


def main() -> None:
    if not settings.mongodb_uri:
        raise SystemExit("Set MONGODB_URI before running the seed script.")

    data = json.loads(Path(settings.data_file).read_text(encoding="utf-8"))
    client = MongoClient(settings.mongodb_uri)
    database = client[settings.mongodb_database]

    chapters = []
    verses = []
    for chapter in data["chapters"]:
        chapter_doc = {key: value for key, value in chapter.items() if key != "verses"}
        chapter_doc["verse_count"] = len(chapter["verses"])
        chapters.append(chapter_doc)
        verses.extend(chapter["verses"])

    database.chapters.delete_many({})
    database.verses.delete_many({})
    database.site_content.delete_many({})

    if chapters:
        database.chapters.insert_many(chapters)
    if verses:
        database.verses.insert_many(verses)

    for key in ["site", "about", "faqs", "quotes", "characters", "theme_definitions", "verse_of_the_day_seed"]:
        database.site_content.insert_one({"key": key, "value": data[key]})

    database.chapters.create_index("id", unique=True)
    database.verses.create_index([("chapter_id", 1), ("verse_number", 1)], unique=True)
    database.verses.create_index("id", unique=True)
    database.verses.create_index("themes")
    database.verses.create_index(
        [
            ("translation", "text"),
            ("commentary", "text"),
            ("story.title", "text"),
            ("story.content", "text"),
            ("pali", "text"),
            ("transliteration", "text"),
        ]
    )

    print(f"Seeded MongoDB database '{settings.mongodb_database}' with {len(chapters)} chapters and {len(verses)} verses.")


if __name__ == "__main__":
    main()
