from __future__ import annotations

import json
from abc import ABC, abstractmethod
from datetime import date
from functools import lru_cache
from pathlib import Path
from typing import Any

from .config import settings


class BaseRepository(ABC):
    repository_name = "base"

    @abstractmethod
    def get_site(self) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def get_about(self) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def get_theme_definitions(self) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def list_chapters(self) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def get_chapter(self, chapter_id: int) -> dict[str, Any] | None:
        raise NotImplementedError

    @abstractmethod
    def get_verse(self, chapter_id: int, verse_number: int) -> dict[str, Any] | None:
        raise NotImplementedError

    @abstractmethod
    def search(self, query: str, limit: int = 20) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def get_quotes(self) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def get_faqs(self) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def get_characters(self) -> list[dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def get_verse_of_the_day(self, today: date | None = None) -> dict[str, Any]:
        raise NotImplementedError


class JsonRepository(BaseRepository):
    repository_name = "json"

    def __init__(self, data_file: Path):
        self.data_file = data_file
        self.data = json.loads(self.data_file.read_text(encoding="utf-8"))
        self.chapter_by_id = {chapter["id"]: chapter for chapter in self.data["chapters"]}
        self.verse_by_id = {
            verse["id"]: verse
            for chapter in self.data["chapters"]
            for verse in chapter["verses"]
        }

    def get_site(self) -> dict[str, Any]:
        return self.data["site"]

    def get_about(self) -> dict[str, Any]:
        return self.data["about"]

    def get_theme_definitions(self) -> list[dict[str, Any]]:
        return self.data["theme_definitions"]

    def list_chapters(self) -> list[dict[str, Any]]:
        return [self._chapter_summary(chapter) for chapter in self.data["chapters"]]

    def get_chapter(self, chapter_id: int) -> dict[str, Any] | None:
        chapter = self.chapter_by_id.get(chapter_id)
        if not chapter:
            return None
        chapter_detail = dict(chapter)
        chapter_detail["verse_count"] = len(chapter["verses"])
        return chapter_detail

    def get_verse(self, chapter_id: int, verse_number: int) -> dict[str, Any] | None:
        chapter = self.chapter_by_id.get(chapter_id)
        if not chapter:
            return None
        return next((verse for verse in chapter["verses"] if verse["verse_number"] == verse_number), None)

    def search(self, query: str, limit: int = 20) -> list[dict[str, Any]]:
        lowered = query.lower().strip()
        direct = self._lookup_direct_verse(query)
        if not lowered:
            return []

        results: list[dict[str, Any]] = []
        for verse in self.verse_by_id.values():
            searchable = " ".join(
                [
                    verse.get("pali", ""),
                    verse.get("transliteration", ""),
                    verse.get("translation", ""),
                    verse.get("commentary", ""),
                    verse.get("story", {}).get("title", ""),
                    verse.get("story", {}).get("content", ""),
                ]
            ).lower()

            if lowered not in searchable and (not direct or direct["id"] != verse["id"]):
                continue

            score = 0.0
            if direct and direct["id"] == verse["id"]:
                score += 5000
            if str(verse["verse_number"]) == query.strip():
                score += 800
            translation = verse["translation"].lower()
            if translation.startswith(lowered):
                score += 300
            elif lowered in translation:
                score += 180
            if lowered in verse["commentary"].lower():
                score += 80
            if lowered in verse["story"]["title"].lower():
                score += 70
            if lowered in verse["transliteration"].lower() or lowered in verse["pali"].lower():
                score += 120
            if verse.get("is_popular"):
                score += 20

            results.append(
                {
                    "verse_id": verse["id"],
                    "chapter_id": verse["chapter_id"],
                    "chapter_name": verse["chapter_name"],
                    "verse_number": verse["verse_number"],
                    "excerpt": self._excerpt(verse, query),
                    "score": score,
                }
            )

        results.sort(key=lambda item: (-item["score"], item["verse_number"]))
        return results[:limit]

    def get_quotes(self) -> list[dict[str, Any]]:
        return self.data["quotes"]

    def get_faqs(self) -> list[dict[str, Any]]:
        return self.data["faqs"]

    def get_characters(self) -> list[dict[str, Any]]:
        return self.data["characters"]

    def get_verse_of_the_day(self, today: date | None = None) -> dict[str, Any]:
        today = today or date.today()
        day_of_year = today.timetuple().tm_yday
        seed = self.data["verse_of_the_day_seed"]
        verse_id = seed[(day_of_year - 1) % len(seed)]
        return {
            "date": today.isoformat(),
            "verse": self.verse_by_id[verse_id],
        }

    def _lookup_direct_verse(self, query: str) -> dict[str, Any] | None:
        trimmed = query.strip()
        if ":" in trimmed or "." in trimmed or "-" in trimmed:
            splitter = ":" if ":" in trimmed else "." if "." in trimmed else "-"
            chapter_text, verse_text = [part.strip() for part in trimmed.split(splitter, 1)]
            if chapter_text.isdigit() and verse_text.isdigit():
                return self.get_verse(int(chapter_text), int(verse_text))
        if trimmed.isdigit():
            verse_number = int(trimmed)
            return next((item for item in self.verse_by_id.values() if item["verse_number"] == verse_number), None)
        return None

    def _excerpt(self, verse: dict[str, Any], query: str) -> str:
        candidates = [
            verse["translation"],
            verse["commentary"],
            verse["story"]["title"],
            verse["story"]["content"],
        ]
        source = next((item for item in candidates if query.lower() in item.lower()), verse["translation"])
        clean = " ".join(source.split())
        if len(clean) <= 150:
            return clean
        return f"{clean[:149].rstrip()}..."

    def _chapter_summary(self, chapter: dict[str, Any]) -> dict[str, Any]:
        summary = {key: value for key, value in chapter.items() if key != "verses"}
        summary["verse_count"] = len(chapter["verses"])
        return summary


class MongoRepository(JsonRepository):
    repository_name = "mongodb"

    def __init__(self, mongodb_uri: str, database_name: str, data_file: Path):
        super().__init__(data_file)
        from pymongo import MongoClient

        self.client = MongoClient(mongodb_uri)
        self.database = self.client[database_name]

    def get_site(self) -> dict[str, Any]:
        return self._get_content_doc("site") or super().get_site()

    def get_about(self) -> dict[str, Any]:
        return self._get_content_doc("about") or super().get_about()

    def get_theme_definitions(self) -> list[dict[str, Any]]:
        return self._get_content_doc("theme_definitions") or super().get_theme_definitions()

    def list_chapters(self) -> list[dict[str, Any]]:
        chapters = list(self.database.chapters.find({}, {"_id": 0}).sort("id", 1))
        return chapters or super().list_chapters()

    def get_chapter(self, chapter_id: int) -> dict[str, Any] | None:
        chapter = self.database.chapters.find_one({"id": chapter_id}, {"_id": 0})
        if not chapter:
            return super().get_chapter(chapter_id)
        chapter["verses"] = list(self.database.verses.find({"chapter_id": chapter_id}, {"_id": 0}).sort("verse_number", 1))
        return chapter

    def get_verse(self, chapter_id: int, verse_number: int) -> dict[str, Any] | None:
        verse = self.database.verses.find_one({"chapter_id": chapter_id, "verse_number": verse_number}, {"_id": 0})
        return verse or super().get_verse(chapter_id, verse_number)

    def get_quotes(self) -> list[dict[str, Any]]:
        return self._get_content_doc("quotes") or super().get_quotes()

    def get_faqs(self) -> list[dict[str, Any]]:
        return self._get_content_doc("faqs") or super().get_faqs()

    def get_characters(self) -> list[dict[str, Any]]:
        return self._get_content_doc("characters") or super().get_characters()

    def get_verse_of_the_day(self, today: date | None = None) -> dict[str, Any]:
        today = today or date.today()
        seed = self._get_content_doc("verse_of_the_day_seed")
        if not seed:
            return super().get_verse_of_the_day(today)
        verse_id = seed[(today.timetuple().tm_yday - 1) % len(seed)]
        verse = self.database.verses.find_one({"id": verse_id}, {"_id": 0}) or self.verse_by_id[verse_id]
        return {"date": today.isoformat(), "verse": verse}

    def _get_content_doc(self, key: str) -> Any:
        document = self.database.site_content.find_one({"key": key}, {"_id": 0, "value": 1})
        return document["value"] if document else None


@lru_cache(maxsize=1)
def get_repository() -> BaseRepository:
    if settings.use_mongodb and settings.mongodb_uri:
        return MongoRepository(settings.mongodb_uri, settings.mongodb_database, settings.data_file)
    return JsonRepository(settings.data_file)
