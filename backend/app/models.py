from __future__ import annotations

from pydantic import BaseModel, Field


class ThemeDefinition(BaseModel):
    id: str
    label: str
    search_query: str
    description: str


class Story(BaseModel):
    title: str
    content: str


class WordMeaning(BaseModel):
    term: str
    meaning: str


class StoryGroup(BaseModel):
    start_verse: int
    end_verse: int
    headnote_pali: str
    headnote_transliteration: str


class SourceReference(BaseModel):
    provider: str
    label: str
    url: str
    note: str | None = None


class VerificationStatus(BaseModel):
    pali: str
    translation: str
    transliteration: str
    commentary: str
    story: str
    word_meanings: str
    themes: str
    related_verses: str


class Verse(BaseModel):
    verse_number: int
    pali: str
    translation: str
    commentary: str
    story: Story
    id: str
    slug: str
    chapter_id: int
    chapter_name: str
    transliteration: str
    word_meanings: list[WordMeaning] = Field(default_factory=list)
    audio_url: str | None = None
    themes: list[str] = Field(default_factory=list)
    is_popular: bool = False
    share_excerpt: str
    seo_title: str
    seo_description: str
    related_verse_ids: list[str] = Field(default_factory=list)
    story_group: StoryGroup | None = None
    source_references: dict[str, SourceReference] = Field(default_factory=dict)
    verification_status: VerificationStatus | None = None


class ChapterSummary(BaseModel):
    id: int
    name_pali: str
    name_en: str
    summary: str
    slug: str
    short_summary: str
    featured: bool = False
    themes: list[str] = Field(default_factory=list)
    verse_count: int


class ChapterDetail(ChapterSummary):
    verses: list[Verse]


class SiteBook(BaseModel):
    chapter_count: int
    verse_count: int
    language_scope: list[str]


class SiteInfo(BaseModel):
    title: str
    tagline: str
    description: str
    author: str
    primary_image: str
    book: SiteBook


class AboutSection(BaseModel):
    id: str
    title: str
    body: str


class AboutContent(BaseModel):
    title: str
    intro: str
    sections: list[AboutSection]


class FaqItem(BaseModel):
    id: str
    question: str
    answer: str


class QuoteItem(BaseModel):
    id: str
    title: str
    text: str
    verse_id: str
    verse_number: int
    chapter_id: int
    chapter_name: str
    theme: str
    excerpt: str


class CharacterItem(BaseModel):
    id: str
    name: str
    role: str
    summary: str
    significance: str
    linked_verse_ids: list[str] = Field(default_factory=list)


class SearchResult(BaseModel):
    verse_id: str
    chapter_id: int
    chapter_name: str
    verse_number: int
    excerpt: str
    score: float


class VerseOfDayResponse(BaseModel):
    date: str
    verse: Verse


class HealthResponse(BaseModel):
    status: str
    repository: str
    mongodb_enabled: bool
