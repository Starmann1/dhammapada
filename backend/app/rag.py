from __future__ import annotations

import math
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass
from typing import Any

from .embeddings import EmbeddingProvider
from .llm import LlmClient
from .repository import BaseRepository


STOP_WORDS = {
    "a",
    "about",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "can",
    "deal",
    "dhammapada",
    "dhp",
    "does",
    "explain",
    "for",
    "from",
    "how",
    "i",
    "in",
    "is",
    "it",
    "me",
    "my",
    "of",
    "on",
    "or",
    "say",
    "says",
    "that",
    "the",
    "this",
    "to",
    "teach",
    "teaches",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "with",
    "verse",
}

QUERY_EXPANSIONS = {
    "advaita": "not-self self craving clinging brahmana duality nirvana nibbana unconditioned",
    "non dual": "not-self self craving clinging pairs duality nirvana nibbana unconditioned",
    "non-dual": "not-self self craving clinging pairs duality nirvana nibbana unconditioned",
    "nondual": "not-self self craving clinging pairs duality nirvana nibbana unconditioned",
    "non-duality": "not-self self craving clinging pairs duality nirvana nibbana unconditioned",
    "nonduality": "not-self self craving clinging pairs duality nirvana nibbana unconditioned",
}


@dataclass(frozen=True)
class RetrievalResult:
    verse: dict[str, Any]
    lexical_score: float
    semantic_score: float
    hybrid_score: float
    excerpt: str


class StructuredHybridRag:
    retrieval_strategy = "structured_hybrid_rag:v2 MongoDB Vector Search + text search with local TF-IDF fallback"

    def __init__(self, repository: BaseRepository):
        self.repository = repository
        self.embedding_provider = EmbeddingProvider()
        self.llm_client = LlmClient()
        self.last_llm_error: str | None = None
        self.verses = repository.list_verses()
        self.verse_by_id = {verse["id"]: verse for verse in self.verses}
        self._build_index()

    def search(self, query: str, limit: int = 5) -> list[RetrievalResult]:
        expanded_query = self._expand_query(query)
        normalized_query = self._normalize(expanded_query)
        if not normalized_query:
            return []

        direct = self._lookup_direct_verse(query)
        if direct:
            return [
                RetrievalResult(
                    verse=direct,
                    lexical_score=20.0,
                    semantic_score=0.0,
                    hybrid_score=2.0,
                    excerpt=self._excerpt(direct, normalized_query),
                )
            ]

        mongodb_results = self._search_mongodb(expanded_query, normalized_query, limit)
        if mongodb_results is not None:
            return mongodb_results

        query_terms = self._tokens(normalized_query)
        query_vector = self._vectorize_query(normalized_query)
        results: list[RetrievalResult] = []

        for verse in self.verses:
            lexical_score = self._lexical_score(verse, normalized_query, direct)
            semantic_score = self._cosine(query_vector, self.document_vectors.get(verse["id"], {}))
            hybrid_score = (0.55 * min(lexical_score / 12.0, 1.0)) + (0.45 * semantic_score)
            if direct and direct["id"] == verse["id"]:
                hybrid_score += 1.0
            if hybrid_score <= 0:
                continue
            results.append(
                RetrievalResult(
                    verse=verse,
                    lexical_score=round(lexical_score, 4),
                    semantic_score=round(semantic_score, 4),
                    hybrid_score=round(hybrid_score, 4),
                    excerpt=self._excerpt(verse, normalized_query),
                )
            )

        results.sort(key=lambda item: (-item.hybrid_score, item.verse["chapter_id"], item.verse["verse_number"]))
        return results[:limit]

    def _search_mongodb(self, query: str, normalized_query: str, limit: int) -> list[RetrievalResult] | None:
        if not hasattr(self.repository, "vector_search") or not hasattr(self.repository, "text_search_verses"):
            return None

        merged: dict[str, dict[str, Any]] = {}
        vector_available = False
        try:
            query_embedding = self.embedding_provider.embed(query)
            vector_docs = self.repository.vector_search(  # type: ignore[attr-defined]
                query_embedding,
                limit=max(limit * 4, 20),
                num_candidates=max(limit * 20, 100),
            )
            vector_available = True
            for doc in vector_docs:
                item = merged.setdefault(doc["id"], {"verse": doc, "vector_score": 0.0, "text_score": 0.0})
                item["verse"] = doc
                item["vector_score"] = float(doc.get("vector_score", 0.0) or 0.0)
        except Exception:
            vector_available = False

        try:
            text_docs = self.repository.text_search_verses(query, limit=max(limit * 4, 20))  # type: ignore[attr-defined]
            for doc in text_docs:
                item = merged.setdefault(doc["id"], {"verse": doc, "vector_score": 0.0, "text_score": 0.0})
                item["verse"] = doc
                item["text_score"] = float(doc.get("text_score", 0.0) or 0.0)
        except Exception:
            text_docs = []

        if not vector_available and not text_docs:
            return None
        if not merged:
            return []

        max_text_score = max((item["text_score"] for item in merged.values()), default=0.0)
        results: list[RetrievalResult] = []
        for item in merged.values():
            verse = item["verse"]
            vector_score = min(max(item["vector_score"], 0.0), 1.0)
            text_score = item["text_score"] / max_text_score if max_text_score > 0 else 0.0
            lexical_signal = max(text_score, min(self._lexical_score(verse, normalized_query, None) / 12.0, 1.0))
            hybrid_score = (0.60 * vector_score) + (0.35 * lexical_signal)
            results.append(
                RetrievalResult(
                    verse=verse,
                    lexical_score=round(lexical_signal, 4),
                    semantic_score=round(vector_score, 4),
                    hybrid_score=round(hybrid_score, 4),
                    excerpt=self._excerpt(verse, normalized_query),
                )
            )

        results.sort(key=lambda item: (-item.hybrid_score, item.verse["chapter_id"], item.verse["verse_number"]))
        return results[:limit]

    def answer(self, question: str, limit: int = 5) -> dict[str, Any]:
        results = self.search(question, limit=limit)
        if not results:
            return {
                "question": question,
                "answer": (
                    "I could not find a grounded Dhammapada passage for that question in the current dataset. "
                    "Try asking with a theme, Pali term, verse number, or a more specific concern."
                ),
                "citations": [],
                "retrieval_strategy": self.retrieval_strategy,
            }

        selected = results[: min(3, len(results))]
        citations = [self._citation(result) for result in results]
        answer = None
        if self.llm_client.enabled:
            try:
                answer = self.llm_client.answer(question, citations)
                self.last_llm_error = None
            except Exception as error:
                self.last_llm_error = str(error)
                print(f"LLM generation failed: {error}")
        answer = answer or self._compose_answer(question, selected)
        return {
            "question": question,
            "answer": answer,
            "citations": citations,
            "retrieval_strategy": self.retrieval_strategy,
        }

    def _build_index(self) -> None:
        self.document_terms: dict[str, Counter[str]] = {}
        document_frequency: Counter[str] = Counter()

        for verse in self.verses:
            terms = Counter(self._tokens(self._document_text(verse)))
            self.document_terms[verse["id"]] = terms
            document_frequency.update(terms.keys())

        total_documents = max(len(self.verses), 1)
        self.idf = {
            term: math.log((1 + total_documents) / (1 + frequency)) + 1.0
            for term, frequency in document_frequency.items()
        }
        self.document_vectors = {
            verse_id: self._normalize_vector({term: count * self.idf.get(term, 1.0) for term, count in terms.items()})
            for verse_id, terms in self.document_terms.items()
        }

    def _document_text(self, verse: dict[str, Any]) -> str:
        story = verse.get("story") or {}
        return " ".join(
            [
                verse.get("translation", ""),
                verse.get("translation", ""),
                verse.get("translation", ""),
                verse.get("commentary", ""),
                verse.get("commentary", ""),
                story.get("title", ""),
                story.get("content", ""),
                verse.get("pali", ""),
                verse.get("transliteration", ""),
                " ".join(verse.get("themes", [])),
                verse.get("chapter_name", ""),
            ]
        )

    def _vectorize_query(self, normalized_query: str) -> dict[str, float]:
        counts = Counter(self._tokens(normalized_query))
        return self._normalize_vector({term: count * self.idf.get(term, 1.0) for term, count in counts.items()})

    def _normalize_vector(self, vector: dict[str, float]) -> dict[str, float]:
        magnitude = math.sqrt(sum(value * value for value in vector.values()))
        if magnitude == 0:
            return {}
        return {term: value / magnitude for term, value in vector.items()}

    def _cosine(self, left: dict[str, float], right: dict[str, float]) -> float:
        if not left or not right:
            return 0.0
        if len(left) > len(right):
            left, right = right, left
        return sum(value * right.get(term, 0.0) for term, value in left.items())

    def _lexical_score(self, verse: dict[str, Any], normalized_query: str, direct: dict[str, Any] | None) -> float:
        if direct and direct["id"] == verse["id"]:
            return 20.0

        translation = self._normalize(verse.get("translation", ""))
        commentary = self._normalize(verse.get("commentary", ""))
        story = self._normalize(" ".join([verse.get("story", {}).get("title", ""), verse.get("story", {}).get("content", "")]))
        pali = self._normalize(" ".join([verse.get("pali", ""), verse.get("transliteration", "")]))
        themes = self._normalize(" ".join(verse.get("themes", [])))

        score = 0.0
        for text, weight in ((translation, 5.0), (commentary, 3.0), (story, 2.0), (pali, 2.5), (themes, 4.0)):
            if not text:
                continue
            if normalized_query in text:
                score += weight
            score += weight * 0.25 * self._token_overlap(normalized_query, text)

        if verse.get("is_popular"):
            score += 0.2
        return score

    def _token_overlap(self, normalized_query: str, text: str) -> float:
        query_terms = set(self._tokens(normalized_query))
        if not query_terms:
            return 0.0
        text_terms = set(self._tokens(text))
        return len(query_terms & text_terms) / len(query_terms)

    def _lookup_direct_verse(self, query: str) -> dict[str, Any] | None:
        trimmed = query.strip()
        match = re.search(r"\b(?:dhp|dhammapada|verse)?\s*(\d{1,2})\s*[:.-]\s*(\d{1,3})\b", trimmed, flags=re.I)
        if match:
            chapter_id = int(match.group(1))
            verse_reference = int(match.group(2))
            canonical_verse = self.repository.get_verse(chapter_id, verse_reference)
            if canonical_verse:
                return canonical_verse
            chapter = self.repository.get_chapter(chapter_id)
            if not chapter or not (1 <= verse_reference <= len(chapter["verses"])):
                return None
            return chapter["verses"][verse_reference - 1]
        return None

    def _excerpt(self, verse: dict[str, Any], normalized_query: str) -> str:
        fields = [
            verse.get("translation", ""),
            verse.get("commentary", ""),
            verse.get("story", {}).get("content", ""),
            verse.get("pali", ""),
            verse.get("transliteration", ""),
        ]
        query_terms = set(self._tokens(normalized_query))
        source = max(fields, key=lambda text: self._token_overlap(normalized_query, self._normalize(text)) if text else 0.0)
        clean = " ".join(source.split())
        if len(clean) <= 220:
            return clean
        best_index = 0
        for term in query_terms:
            index = self._normalize(clean).find(term)
            if index >= 0:
                best_index = max(index - 70, 0)
                break
        excerpt = clean[best_index : best_index + 220].strip()
        return f"{excerpt.rstrip()}..."

    def _citation(self, result: RetrievalResult) -> dict[str, Any]:
        verse = result.verse
        return {
            "verse_id": verse["id"],
            "chapter_id": verse["chapter_id"],
            "chapter_name": verse["chapter_name"],
            "verse_number": verse["verse_number"],
            "slug": verse["slug"],
            "title": f"Dhammapada {verse['chapter_id']}:{verse['verse_number']} - {verse['chapter_name']}",
            "translation": verse.get("translation", ""),
            "excerpt": result.excerpt,
            "themes": verse.get("themes", []),
            "lexical_score": result.lexical_score,
            "semantic_score": result.semantic_score,
            "hybrid_score": result.hybrid_score,
            "source_references": verse.get("source_references", {}),
        }

    def _compose_answer(self, question: str, results: list[RetrievalResult]) -> str:
        lead = (
            "Based on the retrieved Dhammapada passages, the answer should stay close to practice: "
            "notice the mental cause of suffering, abandon harmful states, and cultivate the opposite wholesome quality."
        )
        lines = [lead]
        for result in results:
            verse = result.verse
            commentary = " ".join(verse.get("commentary", "").split())
            if len(commentary) > 180:
                commentary = f"{commentary[:179].rstrip()}..."
            lines.append(
                f"Dhammapada {verse['chapter_id']}:{verse['verse_number']} teaches: "
                f"\"{verse.get('translation', '')}\" Commentary note: {commentary}"
            )
        lines.append("Use these citations as the authority for the response, and treat any broader interpretation as secondary.")
        return "\n\n".join(lines)

    def _tokens(self, text: str) -> list[str]:
        return [token for token in re.findall(r"[a-z0-9]+", text.lower()) if token not in STOP_WORDS and len(token) > 1]

    def _expand_query(self, query: str) -> str:
        normalized = self._normalize(query)
        additions = [
            expansion
            for trigger, expansion in QUERY_EXPANSIONS.items()
            if trigger in normalized
        ]
        if not additions:
            return query
        return f"{query} {' '.join(additions)}"

    def _normalize(self, text: str) -> str:
        decomposed = unicodedata.normalize("NFKD", text)
        ascii_text = "".join(character for character in decomposed if not unicodedata.combining(character))
        return re.sub(r"\s+", " ", ascii_text.lower()).strip()
