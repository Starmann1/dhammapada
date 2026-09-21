/**
 * @module search
 * Command palette search implementation
 */
import { getAllChapters, getAllThemes, getData } from './store.js';
import { paths } from './router.js';
import { escapeHtml, stripTags } from './render.js';

let searchModal;
let searchInput;
let searchResults;
let debounceTimer;

export function initSearch() {
  searchModal = document.getElementById('searchModal');
  searchInput = document.getElementById('searchInput');
  searchResults = document.getElementById('searchResults') || document.querySelector('.command-palette-results');
  const searchBtn = document.getElementById('searchButton');

  if (!searchModal || !searchInput || !searchResults) return;

  // Search button click
  searchBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openSearch();
  });

  // Global Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (searchModal.classList.contains('open')) {
        closeSearch();
      } else {
        openSearch();
      }
    }
    if (e.key === 'Escape' && searchModal.classList.contains('open')) {
      e.preventDefault();
      closeSearch();
    }
  });

  // Close on backdrop click
  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) closeSearch();
  });

  // Debounced input
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => performSearch(e.target.value.trim()), 150);
  });

  // Keyboard navigation within results
  searchInput.addEventListener('keydown', handleKeyboardNav);
}

export function openSearch() {
  if (!searchModal || !searchInput) return;
  searchModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  searchInput.value = '';
  if (searchResults) {
    searchResults.innerHTML = '<div class="command-palette-empty">Search by keyword, theme, or verse reference like 1:5 or 183</div>';
  }
  setTimeout(() => searchInput.focus(), 50);
}

export function closeSearch() {
  if (!searchModal) return;
  searchModal.classList.remove('open');
  document.body.style.overflow = '';
}

function performSearch(query) {
  if (!query) {
    searchResults.innerHTML = '<div class="command-palette-empty">Search by keyword, theme, or verse reference like 1:5 or 183</div>';
    return;
  }

  const queryLower = query.toLowerCase();

  // Parse query for references
  const isReference = /^(\d+)[:.-](\d+)$/.exec(query); // e.g. 1:5 or 1-5 or 1.5
  const isExactNumber = /^\d+$/.test(query); // e.g. 183

  let refChapter = null;
  let refVerse = null;
  if (isReference) {
    refChapter = Number(isReference[1]);
    refVerse = Number(isReference[2]);
  }

  const chapters = getAllChapters();
  const allVerses = [];
  chapters.forEach(ch => {
    (ch.verses || []).forEach(v => allVerses.push({ verse: v, chapter: ch }));
  });

  // Score Verses
  const verseResults = [];
  for (const item of allVerses) {
    const v = item.verse;
    let score = 0;

    if (isReference && item.chapter.id === refChapter && v.verse_number === refVerse) {
      score += 5000;
    }
    if (isExactNumber && v.verse_number === Number(query)) {
      score += 800;
    }

    const tLower = (v.translation || '').toLowerCase();
    const pLower = (v.pali || '').toLowerCase();
    const cLower = (v.commentary || '').toLowerCase();
    const sLower = (v.story?.title || '').toLowerCase();

    if (tLower.includes(queryLower)) score += 180;
    if (pLower.includes(queryLower)) score += 120;
    if (cLower.includes(queryLower)) score += 80;
    if (sLower.includes(queryLower)) score += 70;

    if (score > 0 && v.is_popular) score += 20;

    if (score > 0) {
      verseResults.push({ ...item, score });
    }
  }
  verseResults.sort((a, b) => b.score - a.score);

  // Score Chapters
  const chapterResults = chapters.filter(ch => {
    const nameEn = (ch.name_en || '').toLowerCase();
    const namePali = (ch.name_pali || '').toLowerCase();
    const summary = (ch.short_summary || ch.summary || '').toLowerCase();
    return nameEn.includes(queryLower) || namePali.includes(queryLower) || summary.includes(queryLower);
  });

  // Score Themes
  const themes = getAllThemes();
  const themeResults = themes.filter(t => {
    const label = (t.label || t.id || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    return label.includes(queryLower) || desc.includes(queryLower);
  });

  renderResults(queryLower, {
    verses: verseResults.slice(0, 10),
    chapters: chapterResults.slice(0, 5),
    themes: themeResults.slice(0, 5)
  });
}

function highlightMatch(text, query) {
  if (!text || !query) return escapeHtml(text || '');
  const cleanText = stripTags(text);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escapeHtml(cleanText).replace(regex, '<mark style="background:var(--accent-subtle);color:var(--accent);padding:0 2px;border-radius:2px;">$1</mark>');
}

function renderResults(query, results) {
  let html = '';

  if (!results.verses.length && !results.chapters.length && !results.themes.length) {
    searchResults.innerHTML = '<div class="command-palette-empty">No teachings match your search.</div>';
    return;
  }

  if (results.chapters.length > 0) {
    html += `
      <div class="command-palette-group">
        <div class="command-palette-group-label">Chapters</div>
        ${results.chapters.map(ch => `
          <a href="${paths.chapter(ch.id)}" class="command-palette-item" data-search-item style="text-decoration:none;">
            <span class="text-accent text-serif" style="font-weight:600;min-width:2ch;">${String(ch.id).padStart(2, '0')}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:500;color:var(--fg);">${highlightMatch(ch.name_en, query)}</div>
              <div style="font-size:var(--font-size-xs);color:var(--fg-subtle);font-style:italic;">${escapeHtml(ch.name_pali)} &middot; ${ch.verses ? ch.verses.length : 0} verses</div>
            </div>
            <span class="command-palette-shortcut">&rarr;</span>
          </a>
        `).join('')}
      </div>
    `;
  }

  if (results.themes.length > 0) {
    html += `
      <div class="command-palette-group">
        <div class="command-palette-group-label">Themes</div>
        ${results.themes.map(t => `
          <a href="${paths.theme(t.id)}" class="command-palette-item" data-search-item style="text-decoration:none;">
            <span class="chip chip--active text-xs" style="pointer-events:none;">Theme</span>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:500;color:var(--fg);text-transform:capitalize;">${highlightMatch(t.label || t.id, query)}</div>
              <div style="font-size:var(--font-size-xs);color:var(--fg-subtle);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(t.description || '')}</div>
            </div>
            <span class="command-palette-shortcut">&rarr;</span>
          </a>
        `).join('')}
      </div>
    `;
  }

  if (results.verses.length > 0) {
    html += `
      <div class="command-palette-group">
        <div class="command-palette-group-label">Verses</div>
        ${results.verses.map(item => {
          const v = item.verse;
          const cleanTranslation = stripTags(v.translation || '');
          const excerpt = cleanTranslation.length > 90 ? cleanTranslation.slice(0, 90) + '...' : cleanTranslation;
          return `
            <a href="${paths.verse(v.id)}" class="command-palette-item" data-search-item style="text-decoration:none;align-items:flex-start;">
              <span class="text-accent text-serif" style="font-weight:600;min-width:3ch;margin-top:2px;">${v.verse_number}</span>
              <div style="flex:1;min-width:0;">
                <div style="font-size:var(--font-size-xs);color:var(--fg-subtle);">${escapeHtml(v.chapter_name)}</div>
                <div class="text-serif" style="font-size:var(--font-size-sm);color:var(--fg-muted);line-height:var(--leading-normal);margin-top:2px;">
                  ${highlightMatch(excerpt, query)}
                </div>
              </div>
              <span class="command-palette-shortcut">&rarr;</span>
            </a>
          `;
        }).join('')}
      </div>
    `;
  }

  searchResults.innerHTML = html;
}

function handleKeyboardNav(e) {
  const items = Array.from(searchResults.querySelectorAll('[data-search-item]'));
  if (!items.length) return;

  const current = searchResults.querySelector('.command-palette-item:focus');
  let index = items.indexOf(current);

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    index = (index + 1) % items.length;
    items[index].focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    index = index <= 0 ? items.length - 1 : index - 1;
    items[index].focus();
  } else if (e.key === 'Enter' && current) {
    current.click();
  }
}
