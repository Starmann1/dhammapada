from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .models import (
    AboutContent,
    ChatRequest,
    ChatResponse,
    ChapterDetail,
    ChapterSummary,
    CharacterItem,
    FaqItem,
    HealthResponse,
    QuoteItem,
    RagStatus,
    SearchResult,
    SiteInfo,
    ThemeDefinition,
    Verse,
    VerseOfDayResponse,
)
from .rag import StructuredHybridRag
from .repository import get_repository

app = FastAPI(title="Dhammapada API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

repository = get_repository()
rag = StructuredHybridRag(repository)


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        repository=repository.repository_name,
        mongodb_enabled=settings.use_mongodb,
    )


@app.get("/api/site", response_model=SiteInfo)
def site() -> SiteInfo:
    return SiteInfo.model_validate(repository.get_site())


@app.get("/api/about", response_model=AboutContent)
def about() -> AboutContent:
    return AboutContent.model_validate(repository.get_about())


@app.get("/api/themes", response_model=list[ThemeDefinition])
def themes() -> list[ThemeDefinition]:
    return [ThemeDefinition.model_validate(item) for item in repository.get_theme_definitions()]


@app.get("/api/chapters", response_model=list[ChapterSummary])
def chapters() -> list[ChapterSummary]:
    return [ChapterSummary.model_validate(item) for item in repository.list_chapters()]


@app.get("/api/chapters/{chapter_id}", response_model=ChapterDetail)
def chapter(chapter_id: int) -> ChapterDetail:
    chapter_data = repository.get_chapter(chapter_id)
    if not chapter_data:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return ChapterDetail.model_validate(chapter_data)


@app.get("/api/verses/{chapter_id}/{verse_number}", response_model=Verse)
def verse(chapter_id: int, verse_number: int) -> Verse:
    verse_data = repository.get_verse(chapter_id, verse_number)
    if not verse_data:
        raise HTTPException(status_code=404, detail="Verse not found")
    return Verse.model_validate(verse_data)


@app.get("/api/search", response_model=list[SearchResult])
def search(q: str = Query(..., min_length=1), limit: int = Query(20, ge=1, le=50)) -> list[SearchResult]:
    results = rag.search(q, limit)
    return [
        SearchResult(
            verse_id=result.verse["id"],
            chapter_id=result.verse["chapter_id"],
            chapter_name=result.verse["chapter_name"],
            verse_number=result.verse["verse_number"],
            excerpt=result.excerpt,
            score=result.hybrid_score,
        )
        for result in results
    ]


@app.get("/api/rag/search", response_model=list[SearchResult])
def rag_search(q: str = Query(..., min_length=1), limit: int = Query(5, ge=1, le=10)) -> list[SearchResult]:
    return [
        SearchResult(
            verse_id=result.verse["id"],
            chapter_id=result.verse["chapter_id"],
            chapter_name=result.verse["chapter_name"],
            verse_number=result.verse["verse_number"],
            excerpt=result.excerpt,
            score=result.hybrid_score,
        )
        for result in rag.search(q, limit)
    ]


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    return ChatResponse.model_validate(rag.answer(request.question, request.limit))


@app.get("/api/rag/status", response_model=RagStatus)
def rag_status() -> RagStatus:
    embedding_status = {}
    if hasattr(repository, "get_embedding_status"):
        try:
            embedding_status = repository.get_embedding_status()
        except Exception:
            embedding_status = {}
    return RagStatus(
        repository=repository.repository_name,
        mongodb_enabled=settings.use_mongodb,
        retrieval_strategy=rag.retrieval_strategy,
        embedding_provider=embedding_status.get("embedding_provider") or rag.embedding_provider.name,
        llm_provider=rag.llm_client.name,
        llm_enabled=rag.llm_client.enabled,
        last_llm_error=rag.last_llm_error,
        vector_index=embedding_status.get("vector_index") or settings.vector_search_index,
        total_verses=embedding_status.get("total_verses"),
        embedded_verses=embedding_status.get("embedded_verses"),
    )


@app.get("/api/quotes", response_model=list[QuoteItem])
def quotes() -> list[QuoteItem]:
    return [QuoteItem.model_validate(item) for item in repository.get_quotes()]


@app.get("/api/faqs", response_model=list[FaqItem])
def faqs() -> list[FaqItem]:
    return [FaqItem.model_validate(item) for item in repository.get_faqs()]


@app.get("/api/characters", response_model=list[CharacterItem])
def characters() -> list[CharacterItem]:
    return [CharacterItem.model_validate(item) for item in repository.get_characters()]


@app.get("/api/verse-of-the-day", response_model=VerseOfDayResponse)
def verse_of_the_day() -> VerseOfDayResponse:
    return VerseOfDayResponse.model_validate(repository.get_verse_of_the_day())
