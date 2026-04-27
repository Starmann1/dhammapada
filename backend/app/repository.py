from __future__ import annotations

import json
import re
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
    def list_verses(self) -> list[dict[str, Any]]:
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

    def list_verses(self) -> list[dict[str, Any]]:
        return list(self.verse_by_id.values())

    def search(self, query: str, limit: int = 20) -> list[dict[str, Any]]:
        lowered = query.lower().strip()
        direct = self._lookup_direct_verse(query)
        if not lowered:
            return []

        results: list[dict[str, Any]] = []
        for verse in self.verse_by_id.values():
            if not self._query_matches_verse(verse, lowered) and (not direct or direct["id"] != verse["id"]):
                continue

            results.append(self._build_search_result(verse, query, direct=direct))

        return self._sort_search_results(results, limit)

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
                chapter = self.chapter_by_id.get(int(chapter_text))
                if not chapter:
                    return None
                verse_reference = int(verse_text)
                canonical_verse = next(
                    (verse for verse in chapter["verses"] if verse["verse_number"] == verse_reference),
                    None,
                )
                if canonical_verse:
                    return canonical_verse
                if 1 <= verse_reference <= len(chapter["verses"]):
                    return chapter["verses"][verse_reference - 1]
                return None
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

    def _searchable_parts(self, verse: dict[str, Any]) -> list[str]:
        return [
            verse.get("pali", ""),
            verse.get("transliteration", ""),
            verse.get("translation", ""),
            verse.get("commentary", ""),
            verse.get("story", {}).get("title", ""),
            verse.get("story", {}).get("content", ""),
        ]

    def _query_matches_verse(self, verse: dict[str, Any], lowered_query: str) -> bool:
        searchable = " ".join(self._searchable_parts(verse)).lower()
        return lowered_query in searchable

    def _build_search_result(
        self,
        verse: dict[str, Any],
        query: str,
        *,
        direct: dict[str, Any] | None = None,
        text_score: float = 0.0,
    ) -> dict[str, Any]:
        return {
            "verse_id": verse["id"],
            "chapter_id": verse["chapter_id"],
            "chapter_name": verse["chapter_name"],
            "verse_number": verse["verse_number"],
            "excerpt": self._excerpt(verse, query),
            "score": self._score_search_result(verse, query, direct=direct, text_score=text_score),
        }

    def _score_search_result(
        self,
        verse: dict[str, Any],
        query: str,
        *,
        direct: dict[str, Any] | None = None,
        text_score: float = 0.0,
    ) -> float:
        lowered = query.lower().strip()
        score = min(max(text_score, 0.0) * 100.0, 3000.0)
        if direct and direct["id"] == verse["id"]:
            score += 5000
        if str(verse["verse_number"]) == query.strip():
            score += 800

        translation = verse.get("translation", "").lower()
        commentary = verse.get("commentary", "").lower()
        story_title = verse.get("story", {}).get("title", "").lower()
        transliteration = verse.get("transliteration", "").lower()
        pali = verse.get("pali", "").lower()

        if translation.startswith(lowered):
            score += 300
        elif lowered in translation:
            score += 180
        if lowered in commentary:
            score += 80
        if lowered in story_title:
            score += 70
        if lowered in transliteration or lowered in pali:
            score += 120
        if verse.get("is_popular"):
            score += 20
        return score

    def _sort_search_results(self, results: list[dict[str, Any]], limit: int) -> list[dict[str, Any]]:
        results.sort(key=lambda item: (-item["score"], item["verse_number"]))
        return results[:limit]

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

    def list_verses(self) -> list[dict[str, Any]]:
        verses = list(self.database.verses.find({}, {"_id": 0}).sort([("chapter_id", 1), ("verse_number", 1)]))
        return verses or super().list_verses()

    def vector_search(
        self,
        query_embedding: list[float],
        *,
        limit: int,
        num_candidates: int = 100,
    ) -> list[dict[str, Any]]:
        cursor = self.database.verses.aggregate(
            [
                {
                    "$vectorSearch": {
                        "index": settings.vector_search_index,
                        "path": "embedding",
                        "queryVector": query_embedding,
                        "numCandidates": num_candidates,
                        "limit": limit,
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "id": 1,
                        "slug": 1,
                        "chapter_id": 1,
                        "chapter_name": 1,
                        "chapter_local_number": 1,
                        "verse_number": 1,
                        "pali": 1,
                        "transliteration": 1,
                        "translation": 1,
                        "commentary": 1,
                        "story": 1,
                        "word_meanings": 1,
                        "themes": 1,
                        "is_popular": 1,
                        "share_excerpt": 1,
                        "source_references": 1,
                        "rag_text": 1,
                        "vector_score": {"$meta": "vectorSearchScore"},
                    }
                },
            ]
        )
        return list(cursor)

    def text_search_verses(self, query: str, *, limit: int) -> list[dict[str, Any]]:
        cursor = self.database.verses.find(
            {"$text": {"$search": query.strip()}},
            {
                "_id": 0,
                "id": 1,
                "slug": 1,
                "chapter_id": 1,
                "chapter_name": 1,
                "chapter_local_number": 1,
                "verse_number": 1,
                "pali": 1,
                "transliteration": 1,
                "translation": 1,
                "commentary": 1,
                "story": 1,
                "word_meanings": 1,
                "themes": 1,
                "is_popular": 1,
                "share_excerpt": 1,
                "source_references": 1,
                "rag_text": 1,
                "text_score": {"$meta": "textScore"},
            },
        ).sort([("text_score", {"$meta": "textScore"})]).limit(limit)
        return list(cursor)

    def get_embedding_status(self) -> dict[str, Any]:
        total = self.database.verses.count_documents({})
        embedded = self.database.verses.count_documents({"embedding": {"$type": "array"}})
        sample = self.database.verses.find_one({"embedding": {"$type": "array"}}, {"_id": 0, "embedding": {"$slice": 1}, "embedding_provider": 1})
        return {
            "total_verses": total,
            "embedded_verses": embedded,
            "embedding_provider": sample.get("embedding_provider") if sample else None,
            "vector_index": settings.vector_search_index,
        }

    def search(self, query: str, limit: int = 20) -> list[dict[str, Any]]:
        lowered = query.lower().strip()
        if not lowered:
            return []

        direct = self._lookup_direct_verse(query)
        results_by_id: dict[str, dict[str, Any]] = {}
        if direct:
            self._store_search_result(results_by_id, self._build_search_result(direct, query, direct=direct))

        candidate_limit = max(limit * 5, 20)
        try:
            text_cursor = self.database.verses.find(
                {"$text": {"$search": query.strip()}},
                {"_id": 0, "text_score": {"$meta": "textScore"}},
            ).sort([("text_score", {"$meta": "textScore"})]).limit(candidate_limit)
            for verse in text_cursor:
                text_score = float(verse.pop("text_score", 0.0) or 0.0)
                self._store_search_result(
                    results_by_id,
                    self._build_search_result(verse, query, direct=direct, text_score=text_score),
                )
        except Exception:
            pass

        if len(results_by_id) < limit:
            for verse in self._regex_search_verses(query, exclude_ids=set(results_by_id), limit=candidate_limit):
                self._store_search_result(results_by_id, self._build_search_result(verse, query, direct=direct))

        if not results_by_id:
            return []

        return self._sort_search_results(list(results_by_id.values()), limit)

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

    def _lookup_direct_verse(self, query: str) -> dict[str, Any] | None:
        trimmed = query.strip()
        if ":" in trimmed or "." in trimmed or "-" in trimmed:
            splitter = ":" if ":" in trimmed else "." if "." in trimmed else "-"
            chapter_text, verse_text = [part.strip() for part in trimmed.split(splitter, 1)]
            if chapter_text.isdigit() and verse_text.isdigit():
                chapter_id = int(chapter_text)
                verse_reference = int(verse_text)
                canonical_verse = self.get_verse(chapter_id, verse_reference)
                if canonical_verse:
                    return canonical_verse
                verse = self.database.verses.find_one(
                    {"chapter_id": chapter_id, "chapter_local_number": verse_reference},
                    {"_id": 0, "embedding": 0},
                )
                if verse:
                    return verse
                chapter = self.get_chapter(chapter_id)
                if not chapter or not (1 <= verse_reference <= len(chapter["verses"])):
                    return None
                return chapter["verses"][verse_reference - 1]
        if trimmed.isdigit():
            verse = self.database.verses.find_one({"verse_number": int(trimmed)}, {"_id": 0})
            return verse or super()._lookup_direct_verse(query)
        return None

    def _store_search_result(self, results_by_id: dict[str, dict[str, Any]], result: dict[str, Any]) -> None:
        current = results_by_id.get(result["verse_id"])
        if not current or result["score"] > current["score"]:
            results_by_id[result["verse_id"]] = result

    def _regex_search_verses(
        self,
        query: str,
        *,
        exclude_ids: set[str],
        limit: int,
    ) -> list[dict[str, Any]]:
        pattern = re.escape(query.strip())
        if not pattern:
            return []

        filters = [
            {"translation": {"$regex": pattern, "$options": "i"}},
            {"commentary": {"$regex": pattern, "$options": "i"}},
            {"story.title": {"$regex": pattern, "$options": "i"}},
            {"story.content": {"$regex": pattern, "$options": "i"}},
            {"transliteration": {"$regex": pattern, "$options": "i"}},
            {"pali": {"$regex": pattern, "$options": "i"}},
        ]
        query_filter: dict[str, Any] = {"$or": filters}
        if exclude_ids:
            query_filter["id"] = {"$nin": list(exclude_ids)}
        return list(self.database.verses.find(query_filter, {"_id": 0}).limit(limit))

@lru_cache(maxsize=1)
def get_repository() -> BaseRepository:
    if settings.use_mongodb and settings.mongodb_uri:
        return MongoRepository(settings.mongodb_uri, settings.mongodb_database, settings.data_file)
    return JsonRepository(settings.data_file)
