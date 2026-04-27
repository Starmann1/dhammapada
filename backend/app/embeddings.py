from __future__ import annotations

import hashlib
import json
import math
import re
import unicodedata
import urllib.request
from typing import Any

from .config import settings


def build_rag_text(verse: dict[str, Any]) -> str:
    story = verse.get("story") or {}
    word_meanings = verse.get("word_meanings") or []
    return "\n".join(
        part
        for part in [
            f"Chapter: {verse.get('chapter_id')} - {verse.get('chapter_name')}",
            f"Verse: {verse.get('verse_number')}",
            f"Themes: {', '.join(verse.get('themes', []))}",
            f"Translation: {verse.get('translation', '')}",
            f"Commentary: {verse.get('commentary', '')}",
            f"Story title: {story.get('title', '')}",
            f"Story: {story.get('content', '')}",
            f"Pali: {verse.get('pali', '')}",
            f"Transliteration: {verse.get('transliteration', '')}",
            "Word meanings: "
            + "; ".join(f"{item.get('term', '')}: {item.get('meaning', '')}" for item in word_meanings),
        ]
        if part.strip()
    )


class EmbeddingProvider:
    def __init__(
        self,
        *,
        provider: str = settings.embedding_provider,
        model: str = settings.embedding_model,
        dimensions: int = settings.embedding_dimensions,
        api_key: str | None = settings.openai_api_key,
    ) -> None:
        self.provider = provider
        self.model = model
        self.dimensions = dimensions
        self.api_key = api_key

    @property
    def name(self) -> str:
        return f"{self.provider}:{self.model}:{self.dimensions}"

    def embed(self, text: str) -> list[float]:
        if self.provider == "openai":
            return self._embed_openai(text)
        return self._embed_local(text)

    def _embed_openai(self, text: str) -> list[float]:
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is required when EMBEDDING_PROVIDER=openai.")

        payload = {
            "model": self.model,
            "input": text,
        }
        if self.dimensions:
            payload["dimensions"] = self.dimensions

        request = urllib.request.Request(
            "https://api.openai.com/v1/embeddings",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=45) as response:
            data = json.loads(response.read().decode("utf-8"))
        embedding = data["data"][0]["embedding"]
        return [float(value) for value in embedding]

    def _embed_local(self, text: str) -> list[float]:
        vector = [0.0] * self.dimensions
        tokens = self._tokens(text)
        if not tokens:
            return vector

        for token in tokens:
            digest = hashlib.blake2b(token.encode("utf-8"), digest_size=16).digest()
            index = int.from_bytes(digest[:8], "big") % self.dimensions
            sign = 1.0 if digest[8] % 2 == 0 else -1.0
            vector[index] += sign

        magnitude = math.sqrt(sum(value * value for value in vector))
        if magnitude == 0:
            return vector
        return [round(value / magnitude, 8) for value in vector]

    def _tokens(self, text: str) -> list[str]:
        decomposed = unicodedata.normalize("NFKD", text)
        normalized = "".join(character for character in decomposed if not unicodedata.combining(character))
        return re.findall(r"[a-z0-9]+", normalized.lower())
