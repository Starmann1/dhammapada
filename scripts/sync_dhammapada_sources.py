from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections import defaultdict
from dataclasses import dataclass
from html import unescape
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen


ROOT_RAW_BASE = "https://raw.githubusercontent.com/suttacentral/sc-data/main"
TIPITAKA_VERSE_BASE = "https://www.tipitaka.net/tipitaka/dhp/verseload.php?verse="
ANCIENT_BUDDHIST_TEXTS_BASE = "https://ancient-buddhist-texts.net/Texts-and-Translations/Dhammapada/"
THEME_KEYWORDS: dict[str, tuple[str, ...]] = {
    "mind-training": ("mind", "mental", "thought", "attention", "awareness", "memory", "consciousness"),
    "compassion": ("hatred", "anger", "love", "compassion", "kindness", "forgive", "enmity", "peace"),
    "effort": ("effort", "energy", "diligent", "heedful", "heedfulness", "strive", "practice", "meditation"),
    "wisdom": ("wise", "wisdom", "understand", "knowledge", "truth", "delusion", "insight", "discern"),
    "ethics": ("deed", "action", "speech", "conduct", "virtue", "discipline", "self-control", "restraint"),
    "impermanence": ("death", "die", "mortal", "aging", "impermanent", "decay", "old age"),
    "desire": ("desire", "craving", "lust", "greed", "attachment", "sensual", "pleasure", "thirst"),
    "liberation": ("nibbana", "nirvana", "deathless", "freedom", "liberation", "arahant", "release"),
}


@dataclass(frozen=True)
class CanonicalVerse:
    verse_number: int
    pali: str
    transliteration: str
    translation: str
    story_start_verse: int
    story_end_verse: int
    story_headnote_pali: str
    story_headnote_transliteration: str
    pali_source_url: str
    translation_source_url: str
    story_source_url: str


def fetch_text(url: str) -> str:
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=60) as response:
        return response.read().decode("utf-8")


def fetch_json(url: str) -> dict[str, Any]:
    return json.loads(fetch_text(url))


def clean_text(value: str) -> str:
    text = unescape(value).replace("\r", "")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def transliterate_ascii(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    stripped = "".join(char for char in normalized if not unicodedata.combining(char))
    return stripped.replace("ṁ", "m").replace("ṃ", "m")


def sort_key(part: str) -> tuple[int, ...]:
    return tuple(int(piece) for piece in part.split("."))


def keep_contiguous_segments(parts: list[tuple[tuple[int, ...], str]]) -> list[tuple[tuple[int, ...], str]]:
    contiguous: list[tuple[tuple[int, ...], str]] = []
    expected = 1
    for key, value in sorted(parts, key=lambda item: item[0]):
        if len(key) != 1:
            contiguous.append((key, value))
            continue
        if key[0] != expected:
            break
        contiguous.append((key, value))
        expected += 1
    return contiguous


def format_pali_segments(segments: list[str]) -> str:
    text = " ".join(segment.strip() for segment in segments if segment.strip())
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r";\s+", ";\n", text)
    text = re.sub(r":\s+", ":\n", text)
    return text


def strip_tags(value: str) -> str:
    return clean_text(re.sub(r"<[^>]+>", "", value))


def strip_interlinear_markup(value: str) -> str:
    text = re.sub(r'<span class="TT">.*?</span>', '', value, flags=re.S)
    text = re.sub(r"<sup.*?</sup>", "", text, flags=re.S)
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    text = re.sub(r"\[\d+\]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def truncate_text(text: str, length: int) -> str:
    clean = re.sub(r"\s+", " ", text).strip()
    if len(clean) <= length:
        return clean
    return f"{clean[: max(length - 3, 0)].rstrip()}..."


def chapter_ranges(data: dict[str, Any]) -> list[tuple[int, int]]:
    ranges: list[tuple[int, int]] = []
    for chapter in data["chapters"]:
        numbers = [verse["verse_number"] for verse in chapter["verses"]]
        ranges.append((min(numbers), max(numbers)))
    return ranges


def fetch_interlinear_chapters() -> list[tuple[str, int, int]]:
    html = fetch_text(ANCIENT_BUDDHIST_TEXTS_BASE)
    chapters: list[tuple[str, int, int]] = []
    for href, label in re.findall(r'<a href="([^"]+)">([^<]+)</a>', html):
        match = re.match(r"\d+\. .*\((\d+)-(\d+)\)", label.strip())
        if match:
            chapters.append((href, int(match.group(1)), int(match.group(2))))
    return chapters


def parse_interlinear_word_meanings() -> dict[int, list[dict[str, str]]]:
    verse_map: dict[int, list[dict[str, str]]] = {}

    for href, start, end in fetch_interlinear_chapters():
        html = fetch_text(f"{ANCIENT_BUDDHIST_TEXTS_BASE}{href}")
        body_match = re.search(r'<div class="verse3">(.*)', html, re.S)
        if not body_match:
            raise RuntimeError(f"Unable to parse interlinear body for {href}")
        body = body_match.group(1)
        chunks = re.findall(r"<p>(.*?)</p>", body, re.S)
        current_pairs: list[dict[str, str]] = []

        for chunk in chunks:
            if "<b>" not in chunk:
                continue
            bold = re.search(r"<b>(.*?)</b>", chunk, re.S)
            if not bold:
                continue

            term = strip_interlinear_markup(bold.group(1)).rstrip(" ,;:.")
            after = chunk[bold.end():]
            after = re.sub(r"^\s*<br\s*/?>", "", after)
            meaning = strip_interlinear_markup(after)
            if not term or not meaning:
                continue

            current_pairs.append({"term": term, "meaning": meaning})
            number_match = re.search(r"\[(\d+)\]", chunk)
            if not number_match:
                continue

            verse_number = int(number_match.group(1))
            if start <= verse_number <= end:
                verse_map[verse_number] = current_pairs
            current_pairs = []

    if len(verse_map) != 423:
        raise RuntimeError(f"Expected interlinear meanings for 423 verses, found {len(verse_map)}")

    return verse_map


def parse_root_range(start: int, end: int) -> tuple[dict[int, list[str]], dict[int, str], str]:
    url = f"{ROOT_RAW_BASE}/sc_bilara_data/root/pli/ms/sutta/kn/dhp/dhp{start}-{end}_root-pli-ms.json"
    payload = fetch_json(url)
    verse_segments: dict[int, list[tuple[tuple[int, ...], str]]] = defaultdict(list)
    story_heads: dict[int, list[tuple[tuple[int, ...], str]]] = defaultdict(list)

    for key, value in payload.items():
        match = re.match(r"dhp(\d+):(\d+(?:\.\d+)?)$", key)
        if not match:
            continue
        verse_number = int(match.group(1))
        part = match.group(2)
        cleaned = clean_text(value)
        if part.startswith("0"):
            story_heads[verse_number].append((sort_key(part), cleaned))
        else:
            verse_segments[verse_number].append((sort_key(part), cleaned))

    ordered_segments = {
        verse_number: [
            value
            for _, value in (
                sorted(parts, key=lambda item: item[0])[:6]
                if verse_number == 423 and len(parts) > 6
                else sorted(parts, key=lambda item: item[0])
            )
        ]
        for verse_number, parts in verse_segments.items()
    }
    ordered_story_heads = {
        verse_number: sorted(parts, key=lambda item: item[0])[-1][1]
        for verse_number, parts in story_heads.items()
    }
    return ordered_segments, ordered_story_heads, url


def parse_translation_range(start: int, end: int) -> tuple[dict[int, str], str]:
    url = f"{ROOT_RAW_BASE}/sc_bilara_data/translation/en/sujato/sutta/kn/dhp/dhp{start}-{end}_translation-en-sujato.json"
    payload = fetch_json(url)
    verse_segments: dict[int, list[tuple[tuple[int, ...], str]]] = defaultdict(list)

    for key, value in payload.items():
        match = re.match(r"dhp(\d+):(\d+(?:\.\d+)?)$", key)
        if not match:
            continue
        verse_number = int(match.group(1))
        part = match.group(2)
        if part.startswith("0"):
            continue
        verse_segments[verse_number].append((sort_key(part), clean_text(value)))

    verses = {
        verse_number: " ".join(value for _, value in keep_contiguous_segments(parts)).strip()
        for verse_number, parts in verse_segments.items()
    }
    return verses, url


def build_canonical_map(data: dict[str, Any]) -> dict[int, CanonicalVerse]:
    ranges = chapter_ranges(data)
    pali_by_verse: dict[int, str] = {}
    translation_by_verse: dict[int, str] = {}
    story_headings: dict[int, str] = {}
    pali_source_by_verse: dict[int, str] = {}
    translation_source_by_verse: dict[int, str] = {}

    for start, end in ranges:
        verse_segments, story_heads, pali_source_url = parse_root_range(start, end)
        translations, translation_source_url = parse_translation_range(start, end)

        for verse_number in range(start, end + 1):
            if verse_number not in verse_segments or verse_number not in translations:
                raise RuntimeError(f"Missing canonical source data for verse {verse_number}")

            pali_by_verse[verse_number] = format_pali_segments(verse_segments[verse_number])
            translation_by_verse[verse_number] = translations[verse_number]
            pali_source_by_verse[verse_number] = pali_source_url
            translation_source_by_verse[verse_number] = translation_source_url

        story_headings.update(story_heads)

    story_starts = sorted(story_headings)
    canonical: dict[int, CanonicalVerse] = {}
    for index, story_start in enumerate(story_starts):
        story_end = story_starts[index + 1] - 1 if index + 1 < len(story_starts) else 423
        for verse_number in range(story_start, story_end + 1):
            pali = pali_by_verse[verse_number]
            canonical[verse_number] = CanonicalVerse(
                verse_number=verse_number,
                pali=pali,
                transliteration=transliterate_ascii(pali),
                translation=translation_by_verse[verse_number],
                story_start_verse=story_start,
                story_end_verse=story_end,
                story_headnote_pali=story_headings[story_start],
                story_headnote_transliteration=transliterate_ascii(story_headings[story_start]),
                pali_source_url=pali_source_by_verse[verse_number],
                translation_source_url=translation_source_by_verse[verse_number],
                story_source_url=f"{TIPITAKA_VERSE_BASE}{story_start:03d}",
            )

    if len(canonical) != 423:
        raise RuntimeError(f"Expected 423 canonical verses, found {len(canonical)}")

    return canonical


def score_themes(text: str) -> list[str]:
    lowered = text.lower()
    scored: list[tuple[int, str]] = []
    for theme_id, keywords in THEME_KEYWORDS.items():
        score = sum(lowered.count(keyword) for keyword in keywords)
        if score:
            scored.append((score, theme_id))

    scored.sort(key=lambda item: (-item[0], item[1]))
    return [theme_id for _, theme_id in scored[:3]]


def build_related_ids(
    verse: dict[str, Any],
    chapter: dict[str, Any],
    chapter_verses: dict[int, dict[str, Any]],
    verses_by_number: dict[int, dict[str, Any]],
) -> list[str]:
    related: list[str] = []
    group = verse["story_group"]
    current = verse["verse_number"]

    for number in range(group["start_verse"], group["end_verse"] + 1):
        if number != current and number in verses_by_number:
            related.append(verses_by_number[number]["id"])

    for candidate in (current - 1, current + 1):
        if candidate in chapter_verses:
            related.append(chapter_verses[candidate]["id"])

    primary_theme = verse["themes"][0] if verse["themes"] else None
    if primary_theme:
        additional = sorted(
            (
                other for other in chapter["verses"]
                if other["id"] != verse["id"] and primary_theme in other.get("themes", [])
            ),
            key=lambda other: abs(other["verse_number"] - current),
        )
        for other in additional:
            related.append(other["id"])

    deduped: list[str] = []
    seen: set[str] = set()
    for verse_id in related:
        if verse_id in seen:
            continue
        seen.add(verse_id)
        deduped.append(verse_id)
        if len(deduped) == 3:
            break
    return deduped


def update_data(data: dict[str, Any], canonical_map: dict[int, CanonicalVerse]) -> dict[str, Any]:
    interlinear_word_meanings = parse_interlinear_word_meanings()
    verses_by_number: dict[int, dict[str, Any]] = {}
    for chapter in data["chapters"]:
        for verse in chapter["verses"]:
            canonical = canonical_map[verse["verse_number"]]
            verse["pali"] = canonical.pali
            verse["transliteration"] = canonical.transliteration
            verse["translation"] = canonical.translation
            verse["word_meanings"] = interlinear_word_meanings.get(verse["verse_number"], [])
            verse["share_excerpt"] = truncate_text(canonical.translation, 180)
            verse["seo_title"] = f"Dhammapada Verse {verse['verse_number']} | {chapter['name_en']}"
            verse["seo_description"] = truncate_text(canonical.translation, 155)
            verse["story_group"] = {
                "start_verse": canonical.story_start_verse,
                "end_verse": canonical.story_end_verse,
                "headnote_pali": canonical.story_headnote_pali,
                "headnote_transliteration": canonical.story_headnote_transliteration,
            }
            verse["source_references"] = {
                "pali": {
                    "provider": "SuttaCentral",
                    "label": "Pali root text",
                    "url": canonical.pali_source_url,
                    "note": f"Canonical root text for verse {verse['verse_number']}.",
                },
                "translation": {
                    "provider": "SuttaCentral",
                    "label": "English translation by Bhikkhu Sujato",
                    "url": canonical.translation_source_url,
                    "note": "Translation is synchronized from the corresponding SuttaCentral source file for this chapter range.",
                },
                "transliteration": {
                    "provider": "Local derivation",
                    "label": "ASCII transliteration",
                    "url": canonical.pali_source_url,
                    "note": "Generated directly from the verified Pali text by removing diacritics.",
                },
                "commentary": {
                    "provider": "Tipitaka.net reference",
                    "label": "Traditional verses and stories page",
                    "url": canonical.story_source_url,
                    "note": "Current commentary is a study-note summary and should be checked against the linked traditional source.",
                },
                "story": {
                    "provider": "Tipitaka.net reference",
                    "label": "Traditional story page",
                    "url": canonical.story_source_url,
                    "note": f"Traditional story source shared by verses {canonical.story_start_verse}-{canonical.story_end_verse}.",
                },
                "word_meanings": {
                    "provider": "Ancient Buddhist Texts",
                    "label": "Interlinear phrase meanings",
                    "url": f"{ANCIENT_BUDDHIST_TEXTS_BASE}",
                    "note": "Phrase-by-phrase meanings are synchronized from the interlinear Dhammapada by Ānandajoti Bhikkhu.",
                },
                "themes": {
                    "provider": "Local study classification",
                    "label": "Browsing tags",
                    "url": canonical.translation_source_url,
                    "note": "Tags are reading aids inferred from the verse translation, not canonical taxonomy.",
                },
                "related_verses": {
                    "provider": "Local study graph",
                    "label": "Suggested related verses",
                    "url": canonical.story_source_url,
                    "note": "Suggestions prioritize traditional story grouping and nearby chapter context.",
                },
            }
            verse["verification_status"] = {
                "pali": "verified",
                "translation": "verified",
                "transliteration": "derived-from-verified-pali",
                "commentary": "editorial-review-needed",
                "story": "source-linked-summary",
                "word_meanings": "source-linked-summary" if verse.get("word_meanings") else "not-added",
                "themes": "study-aid",
                "related_verses": "study-aid",
            }
            theme_source = " ".join(
                [
                    canonical.translation,
                    verse.get("commentary", ""),
                    verse.get("story", {}).get("title", ""),
                    chapter["name_en"],
                ]
            )
            verse["themes"] = score_themes(theme_source)
            verses_by_number[verse["verse_number"]] = verse

    for chapter in data["chapters"]:
        chapter_verse_map = {verse["verse_number"]: verse for verse in chapter["verses"]}
        theme_counts: dict[str, int] = defaultdict(int)
        for verse in chapter["verses"]:
            for theme_id in verse["themes"]:
                theme_counts[theme_id] += 1

        chapter["themes"] = [
            theme_id
            for theme_id, _ in sorted(theme_counts.items(), key=lambda item: (-item[1], item[0]))[:3]
        ]

        for verse in chapter["verses"]:
            if not verse["themes"] and chapter["themes"]:
                verse["themes"] = chapter["themes"][:1]
            verse["related_verse_ids"] = build_related_ids(verse, chapter, chapter_verse_map, verses_by_number)

    for quote in data.get("quotes", []):
        matching = verses_by_number.get(quote["verse_number"])
        if matching:
            quote["text"] = matching["translation"]
            quote["excerpt"] = matching["share_excerpt"]

    faqs = data.get("faqs", [])
    verification_faq = {
        "id": "how-are-verses-verified",
        "question": "How are the verses and study notes verified?",
        "answer": "The Pali text and English translation are synchronized against SuttaCentral source files. Commentary, story summaries, glossary notes, tags, and related-verse suggestions remain study aids and are marked for editorial review or source linkage.",
    }
    if not any(item.get("id") == verification_faq["id"] for item in faqs):
        faqs.append(verification_faq)

    return data


def audit_data(data: dict[str, Any], canonical_map: dict[int, CanonicalVerse]) -> dict[str, Any]:
    verses = [verse for chapter in data["chapters"] for verse in chapter["verses"]]
    by_number = {verse["verse_number"]: verse for verse in verses}
    verse_ids = {verse["id"] for verse in verses}
    issues: list[str] = []

    if len(verses) != 423:
        issues.append(f"Expected 423 verses, found {len(verses)}")

    for verse_number, canonical in canonical_map.items():
        verse = by_number.get(verse_number)
        if not verse:
            issues.append(f"Missing verse {verse_number}")
            continue

        if verse.get("pali") != canonical.pali:
            issues.append(f"Verse {verse_number}: Pali text mismatch")
        if verse.get("translation") != canonical.translation:
            issues.append(f"Verse {verse_number}: translation mismatch")
        if verse.get("transliteration") != canonical.transliteration:
            issues.append(f"Verse {verse_number}: transliteration mismatch")

        statuses = verse.get("verification_status", {})
        if statuses.get("pali") != "verified":
            issues.append(f"Verse {verse_number}: missing verified Pali status")

        for related_id in verse.get("related_verse_ids", []):
            if related_id not in verse_ids:
                issues.append(f"Verse {verse_number}: invalid related verse id {related_id}")

    return {
        "verse_count": len(verses),
        "canonical_count": len(canonical_map),
        "issue_count": len(issues),
        "issues": issues[:200],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync and audit the Dhammapada dataset against canonical sources.")
    parser.add_argument("--data-file", default="data/dhammapada.json")
    parser.add_argument("--audit", action="store_true", help="Only audit the dataset; do not rewrite it.")
    args = parser.parse_args()

    data_path = Path(args.data_file)
    data = json.loads(data_path.read_text(encoding="utf-8"))
    canonical_map = build_canonical_map(data)

    if args.audit:
        report = audit_data(data, canonical_map)
        json.dump(report, sys.stdout, ensure_ascii=False, indent=2)
        sys.stdout.write("\n")
        return 0 if report["issue_count"] == 0 else 1

    updated = update_data(data, canonical_map)
    data_path.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = audit_data(updated, canonical_map)
    json.dump(report, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0 if report["issue_count"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
