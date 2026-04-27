from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

from .config import settings


class LlmClient:
    def __init__(
        self,
        *,
        provider: str = settings.llm_provider,
        model: str = settings.llm_model,
        api_key: str | None = settings.openai_api_key,
    ) -> None:
        self.provider = provider
        self.model = model
        self.api_key = api_key

    @property
    def enabled(self) -> bool:
        return self.provider == "openai" and bool(self.api_key)

    @property
    def name(self) -> str:
        return f"{self.provider}:{self.model}" if self.provider != "none" else "none"

    def answer(self, question: str, citations: list[dict[str, Any]]) -> str | None:
        if not self.enabled:
            return None
        return self._answer_openai(question, citations)

    def _answer_openai(self, question: str, citations: list[dict[str, Any]]) -> str:
        context = self._format_context(citations)
        payload = {
            "model": self.model,
            "instructions": (
                "You are a careful Dhammapada study assistant. Use the provided Dhammapada context as the "
                "only authority for claims about the Dhammapada. Always cite exact references such as "
                "Dhammapada 17:223. If the retrieved context is insufficient, say so clearly. "
                "When the user asks for comparison with other philosophical traditions, you may add a short "
                "section titled 'Comparative note' using general philosophical knowledge, but you must clearly "
                "separate it from what the Dhammapada passages establish. Do not invent scripture citations."
            ),
            "input": (
                f"Question:\n{question}\n\n"
                f"Retrieved Dhammapada context:\n{context}\n\n"
                "Write a concise, helpful answer. Prefer 2-5 short paragraphs. Include verse citations inline."
            ),
        }
        request = urllib.request.Request(
            "https://api.openai.com/v1/responses",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"OpenAI LLM request failed: HTTP {error.code}: {detail}") from error

        output_text = data.get("output_text")
        if output_text:
            return str(output_text).strip()

        text_parts: list[str] = []
        for output in data.get("output", []):
            for content in output.get("content", []):
                if content.get("type") in {"output_text", "text"} and content.get("text"):
                    text_parts.append(str(content["text"]))
        return "\n".join(text_parts).strip()

    def _format_context(self, citations: list[dict[str, Any]]) -> str:
        blocks = []
        for citation in citations[:5]:
            refs = citation.get("source_references") or {}
            providers = ", ".join(
                f"{key}: {value.get('provider', '')}" for key, value in refs.items() if isinstance(value, dict)
            )
            blocks.append(
                "\n".join(
                    [
                        f"Reference: {citation.get('title', '')}",
                        f"Translation: {citation.get('translation', '')}",
                        f"Excerpt/commentary/story: {citation.get('excerpt', '')}",
                        f"Themes: {', '.join(citation.get('themes', []))}",
                        f"Sources: {providers}",
                    ]
                )
            )
        return "\n\n---\n\n".join(blocks)
