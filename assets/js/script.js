'use strict';

const IS_PAGES_DIR = window.location.pathname.includes('/pages/');
const PATHS = {
  index: IS_PAGES_DIR ? '../index.html' : 'index.html',
  about: IS_PAGES_DIR ? 'about.html' : 'pages/about.html',
  faq: IS_PAGES_DIR ? 'faq.html' : 'pages/faq.html',
  quotes: IS_PAGES_DIR ? 'quotes.html' : 'pages/quotes.html',
  characters: IS_PAGES_DIR ? 'characters.html' : 'pages/characters.html',
  chapter: (chapterId) => `${IS_PAGES_DIR ? 'chapter.html' : 'pages/chapter.html'}?id=${encodeURIComponent(chapterId)}`,
  verse: (verseId) => `${IS_PAGES_DIR ? 'verse.html' : 'pages/verse.html'}?id=${encodeURIComponent(verseId)}`
};
const SEARCH_RESULT_LIMIT = 20;
const SEARCH_API_CACHE_TTL_MS = 30000;

const state = {
  data: null,
  chapterById: new Map(),
  verseById: new Map(),
  themeById: new Map(),
  loadError: null,
  darkMode: localStorage.getItem('darkMode') === 'true',
  searchApiBase: null,
  searchApiCheckedAt: 0,
  searchRequestId: 0
};

document.addEventListener('DOMContentLoaded', async () => {
  initDarkMode();
  initScrollFeatures();
  initScrollToTop();
  initSearch();
  initChat();
  initGlobalActions();
  setCurrentYear();
  markActiveNav();
  showLoadingState('Loading the Dhammapada...');

  await loadData();

  if (state.loadError) {
    renderGlobalError('Unable to load the Dhammapada', state.loadError);
    return;
  }

  buildIndices();
  renderCurrentPage();
  applyDeferredSearchQuery();
});

function assetPath(file) {
  return IS_PAGES_DIR ? `../assets/${file}` : `assets/${file}`;
}

function dataPath() {
  return IS_PAGES_DIR ? '../data/dhammapada.json' : 'data/dhammapada.json';
}

async function loadData() {
  try {
    const response = await fetch(dataPath(), { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    state.data = await response.json();
  } catch (error) {
    console.error('Error loading data:', error);
    state.loadError = 'The dataset could not be fetched. Check that you are running the site through a local server.';
  }
}

function buildIndices() {
  state.chapterById.clear();
  state.verseById.clear();
  state.themeById.clear();

  state.data.theme_definitions.forEach((theme) => {
    state.themeById.set(theme.id, theme);
  });

  state.data.chapters.forEach((chapter) => {
    state.chapterById.set(chapter.id, chapter);
    chapter.verses.forEach((verse) => {
      state.verseById.set(verse.id, verse);
    });
  });
}

function renderCurrentPage() {
  const page = document.body.dataset.page || 'home';
  if (page === 'home') {
    renderHomePage();
    return;
  }

  if (page === 'chapter') {
    const chapterId = Number(new URLSearchParams(window.location.search).get('id'));
    renderChapterPage(chapterId);
    return;
  }

  if (page === 'verse') {
    const verseId = new URLSearchParams(window.location.search).get('id');
    renderVersePage(verseId);
    return;
  }

  if (page === 'about') {
    renderAboutPage();
    return;
  }

  if (page === 'faq') {
    renderFaqPage();
    return;
  }

  if (page === 'quotes') {
    renderQuotesPage();
    return;
  }

  if (page === 'characters') {
    renderCharactersPage();
  }
}

function getPageContent() {
  return document.getElementById('pageContent');
}

function showLoadingState(message) {
  const pageContent = getPageContent();
  if (!pageContent) {
    return;
  }
  pageContent.innerHTML = `
    <section class="page-shell page-shell-centered">
      <div class="loading-card">
        <div class="loading-spinner" aria-hidden="true"></div>
        <p>${escapeHtml(message)}</p>
      </div>
    </section>
  `;
}

function renderGlobalError(title, message) {
  const pageContent = getPageContent();
  if (!pageContent) {
    return;
  }

  pageContent.innerHTML = `
    <section class="page-shell page-shell-centered">
      <div class="error-card">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(message)}</p>
        <a class="btn-primary" href="${PATHS.index}">Return to Home</a>
      </div>
    </section>
  `;
  updatePageMeta({
    title: 'Unable to Load | The Dhammapada',
    description: message,
    type: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description: message
    }
  });
}

function renderHomePage() {
  const featuredVerses = state.data.featured_verse_ids
    .map((verseId) => state.verseById.get(verseId))
    .filter(Boolean)
    .slice(0, 6);
  const verseOfDay = getVerseOfTheDay();
  const popularThemes = getPopularThemes().slice(0, 6);
  const bookmarkedVerses = getBookmarks()
    .map((verseId) => state.verseById.get(verseId))
    .filter(Boolean);
  const discoveryCards = [
    {
      title: 'About the Text',
      description: 'Context, reading guidance, and the purpose behind this study edition.',
      href: PATHS.about
    },
    {
      title: 'Frequently Asked Questions',
      description: 'Concise answers about the scripture, the study layout, and the current feature set.',
      href: PATHS.faq
    },
    {
      title: 'Memorable Quotes',
      description: 'A quick way to revisit the most quoted verses by theme.',
      href: PATHS.quotes
    }
  ];

  getPageContent().innerHTML = `
    <section class="hero">
      <div class="hero-background">
        <img src="${assetPath('images/buddha.jpg')}" alt="Golden Buddha statue">
        <div class="hero-overlay"></div>
      </div>
      <div class="container hero-content">
        <div class="hero-kicker">A Study Companion for The Dhammapada</div>
        <h1 class="hero-title">${escapeHtml(state.data.site.title)}</h1>
        <p class="hero-subtitle">${escapeHtml(state.data.site.tagline)}</p>
        <div class="hero-buttons">
          <a class="btn-primary" href="#chapters">Start Reading</a>
          <button class="btn-secondary" type="button" data-open-theme-browser="true">Search by Theme</button>
        </div>
        <div class="hero-stats">
          <div class="stat-chip"><strong>${state.data.site.book.chapter_count}</strong> Chapters</div>
          <div class="stat-chip"><strong>${state.data.site.book.verse_count}</strong> Verses</div>
          <div class="stat-chip"><strong>English + Pali</strong> Study View</div>
        </div>
      </div>
    </section>

    <section class="content-section" id="featured-section">
      <div class="container">
        <div class="section-header">
          <div class="section-kicker">Featured Entry Points</div>
          <h2 class="section-title">Popular Verses</h2>
          <p class="section-subtitle">Famous teachings to begin with if you are visiting the text for the first time.</p>
        </div>
        <div class="feature-grid">
          ${featuredVerses.map((verse) => renderVerseFeatureCard(verse)).join('')}
        </div>
      </div>
    </section>

    <section class="content-section accent-section">
      <div class="container two-column-callout">
        <article class="callout-card verse-day-card">
          <div class="section-kicker">Daily Reading</div>
          <h2>Verse of the Day</h2>
          <p class="callout-label">Verse ${verseOfDay.verse.verse_number} from ${escapeHtml(verseOfDay.chapter.name_en)}</p>
          <blockquote>${escapeHtml(verseOfDay.verse.share_excerpt)}</blockquote>
          <div class="tag-list verse-day-tags">
            ${renderThemePills(verseOfDay.verse.themes, { clickable: true })}
          </div>
          <div class="verse-day-actions">
            <a class="btn-primary" href="${PATHS.verse(verseOfDay.verse.id)}">Read Today's Verse</a>
          </div>
        </article>
        <article class="callout-card">
          <div class="section-kicker">Browse by Theme</div>
          <h2>Popular Themes</h2>
          <p class="callout-copy">Use theme-driven browsing when you want to approach the Dhammapada by topic rather than chapter order.</p>
          <div class="theme-cloud">
            ${popularThemes.map((theme) => `
              <button class="theme-chip" type="button" data-search-query="${escapeHtml(theme.search_query)}">
                <span>${escapeHtml(theme.label)}</span>
                <strong>${theme.count}</strong>
              </button>
            `).join('')}
          </div>
        </article>
      </div>
    </section>
    ${bookmarkedVerses.length > 0 ? `
      <section class="content-section">
        <div class="container">
          <div class="section-header section-header-inline">
            <div>
              <div class="section-kicker">Local Study Tools</div>
              <h2 class="section-title">Your Bookmarked Verses</h2>
            </div>
            <p class="section-subtitle">Saved in this browser for quick return visits.</p>
          </div>
          <div class="feature-grid">
            ${bookmarkedVerses.slice(0, 6).map((verse) => renderVerseFeatureCard(verse, { compact: true })).join('')}
          </div>
        </div>
      </section>
    ` : ''}

    <section class="content-section">
      <div class="container">
        <div class="section-header">
          <div class="section-kicker">Supporting Pages</div>
          <h2 class="section-title">Study Beyond the Reader</h2>
          <p class="section-subtitle">The site now includes supporting surfaces for orientation, quick discovery, and repeat visits.</p>
        </div>
        <div class="link-grid">
          ${discoveryCards.map((card) => `
            <a class="surface-card link-card" href="${card.href}">
              <h3>${escapeHtml(card.title)}</h3>
              <p>${escapeHtml(card.description)}</p>
              <span class="link-card-cta">Open page</span>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="content-section">
      <div class="container">
        <div class="section-header section-header-inline">
          <div>
            <div class="section-kicker">Quick Answers</div>
            <h2 class="section-title">FAQ Preview</h2>
          </div>
          <a class="text-link" href="${PATHS.faq}">View all questions</a>
        </div>
        <div class="faq-preview-grid">
          ${state.data.faqs.slice(0, 4).map((item) => `
            <article class="surface-card faq-preview-card">
              <h3>${escapeHtml(item.question)}</h3>
              <p>${escapeHtml(item.answer)}</p>
            </article>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="content-section" id="chapters">
      <div class="container">
        <div class="section-header">
          <div class="section-kicker">Primary Reading Flow</div>
          <h2 class="section-title">Explore the 26 Chapters</h2>
          <p class="section-subtitle">Each chapter now includes summary context, theme tags, verse jump links, and chapter-to-chapter navigation.</p>
        </div>
        <div class="chapter-grid">
          ${state.data.chapters.map((chapter) => renderChapterCard(chapter)).join('')}
        </div>
      </div>
    </section>
  `;

  updatePageMeta({
    title: `${state.data.site.title} | Read, Study, and Explore`,
    description: state.data.site.description,
    type: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: state.data.site.title,
      description: state.data.site.description,
      inLanguage: state.data.site.book.language_scope,
      numberOfPages: state.data.site.book.verse_count,
      author: {
        '@type': 'Person',
        name: 'Traditionally attributed to the Buddha'
      }
    }
  });
}

function renderChapterPage(chapterId) {
  const chapter = state.chapterById.get(chapterId);
  if (!chapter) {
    renderGlobalError('Chapter not found', 'The requested chapter could not be found.');
    return;
  }

  const previousChapter = state.chapterById.get(chapter.id - 1);
  const nextChapter = state.chapterById.get(chapter.id + 1);

  getPageContent().innerHTML = `
    <section class="page-shell">
      ${renderBreadcrumb([
        { label: 'Home', href: PATHS.index },
        { label: chapter.name_en }
      ])}

      <section class="page-hero compact-hero">
        <div class="page-hero-copy">
          <div class="section-kicker">Chapter ${chapter.id}</div>
          <h1>${escapeHtml(chapter.name_en)}</h1>
          <p class="pali-inline">${escapeHtml(chapter.name_pali)}</p>
          <p>${escapeHtml(chapter.short_summary)}</p>
        </div>
        <div class="hero-meta-panel">
          <div class="meta-stat"><strong>${chapter.verses.length}</strong><span>Verses</span></div>
          <div class="meta-stat"><strong>${chapter.themes.length}</strong><span>Key Themes</span></div>
          <div class="tag-list">
            ${renderThemePills(chapter.themes, { clickable: true })}
          </div>
        </div>
      </section>

      <section class="chapter-layout">
        <aside class="panel sidebar-panel">
          <div class="panel-kicker">Chapter Overview</div>
          <h2>Summary</h2>
          <p>${escapeHtml(chapter.summary)}</p>
          <div class="panel-divider"></div>
          <div class="panel-kicker">Navigation</div>
          <div class="nav-stack">
            ${previousChapter ? `
              <a class="mini-nav-card" href="${PATHS.chapter(previousChapter.id)}">
                <span>Previous Chapter</span>
                <strong>${escapeHtml(previousChapter.name_en)}</strong>
              </a>
            ` : ''}
            ${nextChapter ? `
              <a class="mini-nav-card" href="${PATHS.chapter(nextChapter.id)}">
                <span>Next Chapter</span>
                <strong>${escapeHtml(nextChapter.name_en)}</strong>
              </a>
            ` : ''}
          </div>
        </aside>

        <div class="content-stack">
          <section class="panel">
            <div class="section-header section-header-inline">
              <div>
                <div class="section-kicker">Quick Navigation</div>
                <h2 class="section-title">Verse Jump</h2>
              </div>
              <p class="section-subtitle">Jump directly to any verse card in this chapter.</p>
            </div>
            <div class="verse-jump-grid">
              ${chapter.verses.map((verse) => `
                <a class="verse-jump-link" href="#verse-card-${verse.id}">${verse.verse_number}</a>
              `).join('')}
            </div>
          </section>

          <section class="panel">
            <div class="section-header section-header-inline">
              <div>
                <div class="section-kicker">Chapter Reading</div>
                <h2 class="section-title">Verses</h2>
              </div>
              <p class="section-subtitle">Each verse links to a dedicated study page with commentary, study tools, and related passages.</p>
            </div>
            <div class="stack-list">
              ${chapter.verses.map((verse) => renderChapterVerseRow(verse)).join('')}
            </div>
          </section>
        </div>
      </section>
    </section>
  `;

  updatePageMeta({
    title: `Chapter ${chapter.id}: ${chapter.name_en} | The Dhammapada`,
    description: chapter.short_summary,
    type: 'article',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Chapter ${chapter.id}: ${chapter.name_en}`,
      description: chapter.summary,
      isPartOf: {
        '@type': 'Book',
        name: state.data.site.title
      }
    }
  });
}

function renderVersePage(verseId) {
  const verse = state.verseById.get(decodeURIComponent(verseId || ''));
  if (!verse) {
    renderGlobalError('Verse not found', 'The requested verse could not be found.');
    return;
  }

  const chapter = state.chapterById.get(verse.chapter_id);
  const verseIndex = chapter.verses.findIndex((item) => item.id === verse.id);
  const previousVerse = verseIndex > 0 ? chapter.verses[verseIndex - 1] : null;
  const nextVerse = verseIndex < chapter.verses.length - 1 ? chapter.verses[verseIndex + 1] : null;
  const relatedVerses = verse.related_verse_ids.map((item) => state.verseById.get(item)).filter(Boolean);

  getPageContent().innerHTML = `
    <div class="verse-detail verse-detail-classic">
      <div class="container">
        ${renderBreadcrumb([
          { label: 'Home', href: PATHS.index },
          { label: chapter.name_en, href: PATHS.chapter(chapter.id) },
          { label: `Verse ${verse.verse_number}` }
        ])}

        <div class="verse-content">
          <div class="verse-header">
            <div class="verse-number-large">${verse.verse_number}</div>
            <h1 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Verse ${verse.verse_number}</h1>
            <p style="color: var(--text-secondary);">From ${escapeHtml(chapter.name_en)} (${escapeHtml(chapter.name_pali)})</p>
          </div>

          <div class="verse-text">
            <p class="verse-pali-large">${formatMultilineText(verse.pali)}</p>
            <div class="verse-transliteration-inline">
              <div class="card-kicker">Roman Transliteration</div>
              <p class="verse-transliteration-text">${formatMultilineText(verse.transliteration)}</p>
            </div>
            <p class="verse-translation-large">${escapeHtml(verse.translation)}</p>
          </div>

          ${renderClassicVerseAccordion(
            'Commentary',
            formatMultilineText(verse.commentary),
            `verse-commentary-${verse.id}`,
            true
          )}

          ${renderClassicVerseAccordion(
            `Buddhist Story: ${escapeHtml(verse.story.title)}`,
            formatMultilineText(verse.story.content),
            `verse-story-${verse.id}`,
            false
          )}

          ${renderVerseToolsSection(verse, relatedVerses)}
        </div>

        <div class="verse-navigation">
          ${previousVerse ? `
            <a class="nav-button" href="${PATHS.verse(previousVerse.id)}">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              <span>Previous Verse</span>
            </a>
          ` : '<div class="verse-navigation-spacer" aria-hidden="true"></div>'}

          <div class="verse-navigation-actions">
            <button class="action-button" type="button" data-bookmark-id="${verse.id}" aria-pressed="${isBookmarked(verse.id)}">
              ${isBookmarked(verse.id) ? 'Bookmarked' : 'Bookmark'}
            </button>
            <button class="action-button" type="button" data-share-id="${verse.id}">Share Verse</button>
            <button class="action-button" type="button" data-copy-id="${verse.id}">Copy Link</button>
            <a class="action-button action-button-link" href="${PATHS.chapter(chapter.id)}">Back to Chapter</a>
          </div>

          ${nextVerse ? `
            <a class="nav-button" href="${PATHS.verse(nextVerse.id)}">
              <span>Next Verse</span>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </a>
          ` : '<div class="verse-navigation-spacer" aria-hidden="true"></div>'}
        </div>
      </div>
    </div>
  `;

  updatePageMeta({
    title: verse.seo_title,
    description: verse.seo_description,
    type: 'article',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `Verse ${verse.verse_number} | ${chapter.name_en}`,
      description: verse.seo_description,
      articleSection: chapter.name_en,
      text: verse.translation,
      isPartOf: {
        '@type': 'Book',
        name: state.data.site.title
      }
    }
  });
}

function renderClassicVerseAccordion(title, bodyHtml, accordionId, open) {
  return `
    <div class="accordion">
      <button class="accordion-button ${open ? 'active' : ''}" type="button" data-accordion-button aria-expanded="${open}" aria-controls="${accordionId}">
        <span>${title}</span>
        <svg class="accordion-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      <div class="accordion-content ${open ? 'active' : ''}" id="${accordionId}">
        <div class="accordion-body">${bodyHtml}</div>
      </div>
    </div>
  `;
}

function renderVerseToolsSection(verse, relatedVerses) {
  const wordMeaningsBody = verse.word_meanings.length > 0 ? `
    <ul class="word-list">
      ${verse.word_meanings.map((entry) => `
        <li class="word-item">
          <strong>${escapeHtml(entry.term)}</strong>
          <span>${escapeHtml(entry.meaning)}</span>
        </li>
      `).join('')}
    </ul>
  ` : `
    <p class="muted-copy">Curated word-by-word notes are still being added for this verse.</p>
  `;
  const relatedBody = relatedVerses.length > 0 ? `
    <div class="related-verse-grid">
      ${relatedVerses.map((item) => `
        <a class="related-verse-link" href="${PATHS.verse(item.id)}">
          <span class="related-verse-meta">Chapter ${item.chapter_id} - Verse ${item.verse_number}</span>
          <strong>${escapeHtml(item.chapter_name)}</strong>
          <p>${escapeHtml(item.share_excerpt)}</p>
        </a>
      `).join('')}
    </div>
  ` : `
    <p class="muted-copy">Related verse suggestions will appear here as the study graph expands.</p>
  `;

  return `
    <section class="verse-tools-section">
      ${verse.themes.length > 0 ? `
        <div class="verse-theme-row">
          ${renderThemePills(verse.themes, { clickable: true })}
        </div>
        <p class="study-aid-note">These tags are reading aids for browsing and search, not canonical topic labels.</p>
      ` : ''}

      ${renderClassicVerseAccordion(
        'Word Meanings',
        wordMeaningsBody,
        `verse-word-meanings-${verse.id}`,
        false
      )}

      ${renderClassicVerseAccordion(
        'Related Verses',
        relatedBody,
        `verse-related-${verse.id}`,
        false
      )}
    </section>
  `;
}

function renderAboutPage() {
  const about = state.data.about;
  getPageContent().innerHTML = `
    <section class="page-shell">
      ${renderStaticPageHero('About The Dhammapada', about.intro, 'About This Edition')}
      <section class="content-grid about-sections">
        ${about.sections.map((section) => `
          <article class="surface-card prose-card about-section-card">
            <h2>${escapeHtml(section.title)}</h2>
            <p>${escapeHtml(section.body)}</p>
          </article>
        `).join('')}
      </section>
      <section class="content-grid compact-grid">
        <article class="surface-card stat-surface">
          <span class="stat-surface-value">${state.data.site.book.chapter_count}</span>
          <span class="stat-surface-label">Chapters</span>
        </article>
        <article class="surface-card stat-surface">
          <span class="stat-surface-value">${state.data.site.book.verse_count}</span>
          <span class="stat-surface-label">Verses</span>
        </article>
        <article class="surface-card stat-surface">
          <span class="stat-surface-value">${state.data.theme_definitions.length}</span>
          <span class="stat-surface-label">Theme Paths</span>
        </article>
      </section>
    </section>
  `;

  updatePageMeta({
    title: 'About | The Dhammapada',
    description: about.intro,
    type: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About The Dhammapada',
      description: about.intro
    }
  });
}

function renderFaqPage() {
  getPageContent().innerHTML = `
    <section class="page-shell">
      ${renderStaticPageHero('Frequently Asked Questions', 'Answers about the scripture, the study layout, and the current feature set.', 'FAQ')}
      <section class="faq-list">
        ${state.data.faqs.map((item, index) => renderFaqItem(item, index === 0)).join('')}
      </section>
    </section>
  `;

  updatePageMeta({
    title: 'FAQ | The Dhammapada',
    description: 'Common questions about the Dhammapada and this study website.',
    type: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: state.data.faqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    }
  });
}

function renderQuotesPage() {
  const params = new URLSearchParams(window.location.search);
  const activeTheme = params.get('theme');
  const quoteThemes = [...new Set(state.data.quotes.map((quote) => quote.theme))];
  const quotes = activeTheme ? state.data.quotes.filter((quote) => quote.theme === activeTheme) : state.data.quotes;

  getPageContent().innerHTML = `
    <section class="page-shell">
      ${renderStaticPageHero('Memorable Quotes', 'Browse a curated set of often-quoted Dhammapada verses by topic.', 'Quotes')}
      <section class="filter-bar">
        <button class="filter-chip ${activeTheme ? '' : 'active'}" type="button" data-quote-theme="">All</button>
        ${quoteThemes.map((theme) => `
          <button class="filter-chip ${activeTheme === theme ? 'active' : ''}" type="button" data-quote-theme="${escapeHtml(theme)}">
            ${escapeHtml(theme)}
          </button>
        `).join('')}
      </section>
      <section class="quote-grid">
        ${quotes.map((quote) => renderQuoteCard(quote)).join('')}
      </section>
      ${quotes.length === 0 ? '<div class="empty-card">No quotes matched that theme.</div>' : ''}
    </section>
  `;

  updatePageMeta({
    title: 'Quotes | The Dhammapada',
    description: activeTheme ? `Dhammapada quotes for the theme: ${activeTheme}.` : 'Curated Dhammapada quotes and highlighted teachings.',
    type: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Dhammapada Quotes',
      description: 'Curated Dhammapada verses and quotations.'
    }
  });
}

function renderCharactersPage() {
  getPageContent().innerHTML = `
    <section class="page-shell">
      ${renderStaticPageHero('Key Characters', 'Figures who recur in the Dhammapada story tradition and help illuminate the verses.', 'Characters')}
      <section class="character-grid">
        ${state.data.characters.map((character) => renderCharacterCard(character)).join('')}
      </section>
    </section>
  `;

  updatePageMeta({
    title: 'Characters | The Dhammapada',
    description: 'Key figures from the Dhammapada story tradition.',
    type: 'website',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Dhammapada Characters',
      description: 'Important characters connected with Dhammapada stories and teachings.'
    }
  });
}

function renderStaticPageHero(title, description, kicker) {
  return `
    <section class="page-hero">
      <div class="page-hero-copy">
        <div class="section-kicker">${escapeHtml(kicker)}</div>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
      </div>
    </section>
  `;
}

function renderChapterCard(chapter) {
  return `
    <a class="chapter-card" href="${PATHS.chapter(chapter.id)}">
      <div class="chapter-card-top">
        <div class="chapter-number">${chapter.id}</div>
      </div>
      <h3 class="chapter-title">${escapeHtml(chapter.name_en)}</h3>
      <p class="chapter-title-pali">${escapeHtml(chapter.name_pali)}</p>
      <p class="chapter-summary">${escapeHtml(chapter.short_summary)}</p>
      <div class="tag-list">
        ${renderThemePills(chapter.themes, { clickable: true })}
      </div>
      <div class="chapter-meta">
        <span>${chapter.verses.length} verses</span>
      </div>
    </a>
  `;
}

function renderVerseFeatureCard(verse, options = {}) {
  const chapter = state.chapterById.get(verse.chapter_id);
  return `
    <article class="surface-card verse-surface-card ${options.compact ? 'compact' : ''}">
      <div class="card-kicker">Chapter ${verse.chapter_id} | ${escapeHtml(chapter.name_en)}</div>
      <div class="title-row">
        <h3>Verse ${verse.verse_number}</h3>
        ${verse.is_popular ? '<span class="featured-badge">Popular</span>' : ''}
      </div>
      <p class="card-copy">${escapeHtml(verse.share_excerpt)}</p>
      <div class="tag-list">
        ${renderThemePills(verse.themes.slice(0, 3), { clickable: true })}
      </div>
      <div class="card-actions chapter-verse-actions feature-card-actions">
        <a class="chapter-verse-button chapter-verse-open" href="${PATHS.verse(verse.id)}">Open Verse</a>
        <button class="chapter-verse-button chapter-verse-save" type="button" data-bookmark-id="${verse.id}" aria-pressed="${isBookmarked(verse.id)}">
          ${isBookmarked(verse.id) ? 'Saved' : 'Save'}
        </button>
      </div>
    </article>
  `;
}

function renderChapterVerseRow(verse) {
  return `
    <article class="list-card" id="verse-card-${verse.id}">
      <div class="list-card-head">
        <div>
          <div class="card-kicker">Verse ${verse.verse_number}</div>
          <h3>${escapeHtml(verse.share_excerpt)}</h3>
        </div>
        <div class="card-actions chapter-verse-actions">
          <button class="chapter-verse-button chapter-verse-save" type="button" data-bookmark-id="${verse.id}" aria-pressed="${isBookmarked(verse.id)}">
            ${isBookmarked(verse.id) ? 'Saved' : 'Save'}
          </button>
          <a class="chapter-verse-button chapter-verse-open" href="${PATHS.verse(verse.id)}">Study Verse</a>
        </div>
      </div>
      <p class="list-card-script">${truncateText(verse.transliteration, 180)}</p>
      <div class="tag-list">
        ${renderThemePills(verse.themes.slice(0, 3), { clickable: true })}
      </div>
    </article>
  `;
}

function renderMiniVerseCard(verse) {
  const chapter = state.chapterById.get(verse.chapter_id);
  return `
    <a class="mini-verse-card" href="${PATHS.verse(verse.id)}">
      <span class="card-kicker">Chapter ${verse.chapter_id} | Verse ${verse.verse_number}</span>
      <strong>${escapeHtml(chapter.name_en)}</strong>
      <p>${escapeHtml(verse.share_excerpt)}</p>
    </a>
  `;
}

function renderQuoteCard(quote) {
  return `
    <article class="surface-card quote-card">
      <div class="card-kicker">${escapeHtml(quote.theme)}</div>
      <h2>${escapeHtml(quote.title)}</h2>
      <blockquote>${escapeHtml(quote.text)}</blockquote>
      <div class="quote-meta">
        <span>Chapter ${quote.chapter_id} | Verse ${quote.verse_number}</span>
        <a class="text-link" href="${PATHS.verse(quote.verse_id)}">Open verse</a>
      </div>
    </article>
  `;
}

function renderCharacterCard(character) {
  return `
    <article class="surface-card character-card">
      <div class="card-kicker">${escapeHtml(character.role)}</div>
      <h2>${escapeHtml(character.name)}</h2>
      <p>${escapeHtml(character.summary)}</p>
      <p class="muted-copy">${escapeHtml(character.significance)}</p>
      <div class="linked-verses">
        ${character.linked_verse_ids.map((verseId) => {
          const verse = state.verseById.get(verseId);
          return `<a class="mini-tag" href="${PATHS.verse(verse.id)}">Verse ${verse.verse_number}</a>`;
        }).join('')}
      </div>
    </article>
  `;
}

function renderFaqItem(item, open) {
  return `
    <article class="faq-item">
      <button class="faq-question" type="button" data-accordion-button aria-expanded="${open}">
        <span>${escapeHtml(item.question)}</span>
        <span class="accordion-plus">${open ? '-' : '+'}</span>
      </button>
      <div class="faq-answer ${open ? 'open' : ''}">
        <p>${escapeHtml(item.answer)}</p>
      </div>
    </article>
  `;
}

function renderAccordion(title, bodyHtml, slug, open) {
  return `
    <section class="accordion-card">
      <button class="accordion-button" type="button" data-accordion-button aria-expanded="${open}" aria-controls="accordion-${slug}">
        <span>${title}</span>
        <span class="accordion-plus">${open ? '-' : '+'}</span>
      </button>
      <div class="accordion-body ${open ? 'open' : ''}" id="accordion-${slug}">
        ${bodyHtml}
      </div>
    </section>
  `;
}

function renderBreadcrumb(items) {
  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      ${items.map((item, index) => `
        ${index > 0 ? '<span class="breadcrumb-separator">/</span>' : ''}
        ${item.href ? `<a href="${item.href}">${escapeHtml(item.label)}</a>` : `<span>${escapeHtml(item.label)}</span>`}
      `).join('')}
    </nav>
  `;
}

function renderThemePills(themeIds, options = {}) {
  return themeIds.map((themeId) => {
    const theme = state.themeById.get(themeId);
    if (!theme) {
      return '';
    }

    if (options.clickable) {
      return `
        <button class="mini-tag" type="button" data-search-query="${escapeHtml(theme.search_query)}">
          ${escapeHtml(theme.label)}
        </button>
      `;
    }

    return `<span class="mini-tag">${escapeHtml(theme.label)}</span>`;
  }).join('');
}

function getVerseOfTheDay() {
  const seedIds = state.data.verse_of_the_day_seed;
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today - start;
  const dayOfYear = Math.floor(diff / 86400000);
  const verseId = seedIds[(dayOfYear - 1 + seedIds.length) % seedIds.length];
  const verse = state.verseById.get(verseId);
  return {
    verse,
    chapter: state.chapterById.get(verse.chapter_id)
  };
}

function getPopularThemes() {
  const counts = new Map();
  state.verseById.forEach((verse) => {
    verse.themes.forEach((themeId) => {
      counts.set(themeId, (counts.get(themeId) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([themeId, count]) => {
      const theme = state.themeById.get(themeId);
      return { ...theme, count };
    })
    .sort((left, right) => right.count - left.count);
}

function initDarkMode() {
  if (state.darkMode) {
    document.body.classList.add('dark-mode');
  }

  const darkModeToggle = document.getElementById('darkModeToggle');
  if (!darkModeToggle) {
    return;
  }

  darkModeToggle.addEventListener('click', () => {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark-mode', state.darkMode);
    localStorage.setItem('darkMode', String(state.darkMode));
  });
}

function initGlobalActions() {
  document.addEventListener('click', async (event) => {
    const bookmarkButton = event.target.closest('[data-bookmark-id]');
    if (bookmarkButton) {
      toggleBookmark(bookmarkButton.dataset.bookmarkId);
      return;
    }

    const shareButton = event.target.closest('[data-share-id]');
    if (shareButton) {
      await shareVerse(shareButton.dataset.shareId);
      return;
    }

    const copyButton = event.target.closest('[data-copy-id]');
    if (copyButton) {
      await copyVerseLink(copyButton.dataset.copyId);
      return;
    }

    const themeBrowserButton = event.target.closest('[data-open-theme-browser]');
    if (themeBrowserButton) {
      openThemeBrowser();
      return;
    }

    const themeResultButton = event.target.closest('[data-theme-query]');
    if (themeResultButton) {
      openSearch(themeResultButton.dataset.themeQuery || '');
      return;
    }

    const searchChip = event.target.closest('[data-search-query]');
    if (searchChip) {
      openSearch(searchChip.dataset.searchQuery);
      return;
    }

    const accordionButton = event.target.closest('[data-accordion-button]');
    if (accordionButton) {
      toggleAccordion(accordionButton);
      return;
    }

    const quoteFilterButton = event.target.closest('[data-quote-theme]');
    if (quoteFilterButton) {
      applyQuoteThemeFilter(quoteFilterButton.dataset.quoteTheme || '');
    }
  });
}

function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem('bookmarkedVerses') || '[]');
  } catch (error) {
    console.warn('Could not read bookmarks:', error);
    return [];
  }
}

function saveBookmarks(bookmarkIds) {
  localStorage.setItem('bookmarkedVerses', JSON.stringify(bookmarkIds));
}

function isBookmarked(verseId) {
  return getBookmarks().includes(verseId);
}

function toggleBookmark(verseId) {
  const bookmarks = new Set(getBookmarks());
  if (bookmarks.has(verseId)) {
    bookmarks.delete(verseId);
    showToast('Bookmark removed');
  } else {
    bookmarks.add(verseId);
    showToast('Verse bookmarked');
  }
  saveBookmarks([...bookmarks]);
  updateBookmarkButtons(verseId, bookmarks.has(verseId));

  if ((document.body.dataset.page || 'home') === 'home') {
    renderHomePage();
  }
}

function updateBookmarkButtons(verseId, isSaved) {
  document.querySelectorAll(`[data-bookmark-id="${CSS.escape(verseId)}"]`).forEach((button) => {
    button.setAttribute('aria-pressed', String(isSaved));
    button.textContent = isSaved ? 'Bookmarked' : 'Bookmark';
    if (button.classList.contains('ghost-link') || button.classList.contains('chapter-verse-save')) {
      button.textContent = isSaved ? 'Saved' : 'Save';
    }
  });
}

async function shareVerse(verseId) {
  const verse = state.verseById.get(verseId);
  if (!verse) {
    return;
  }

  const url = absoluteUrl(PATHS.verse(verseId));
  const payload = {
    title: verse.seo_title,
    text: verse.share_excerpt,
    url
  };

  if (navigator.share) {
    try {
      await navigator.share(payload);
      return;
    } catch (error) {
      console.warn('Share cancelled or failed:', error);
    }
  }

  await copyToClipboard(url);
  showToast('Verse link copied');
}

async function copyVerseLink(verseId) {
  await copyToClipboard(absoluteUrl(PATHS.verse(verseId)));
  showToast('Link copied to clipboard');
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const tempInput = document.createElement('textarea');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  tempInput.remove();
}

function initSearch() {
  const searchButton = document.getElementById('searchButton');
  const searchModal = document.getElementById('searchModal');
  const searchModalContent = searchModal?.querySelector('.search-modal-content');
  const searchInput = document.getElementById('searchInput');
  const searchInputWrapper = searchModal?.querySelector('.search-input-wrapper');
  const searchResults = document.getElementById('searchResults');

  if (!searchButton || !searchModal || !searchModalContent || !searchInput || !searchInputWrapper || !searchResults) {
    return;
  }

  searchButton.addEventListener('click', () => {
    openSearch('');
  });

  searchModal.addEventListener('click', (event) => {
    if (event.target === searchModal) {
      closeSearch();
    }
  });

  searchResults.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      closeSearch();
    }
  });

  searchInput.addEventListener('input', (event) => {
    void performSearch(event.target.value);
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch(searchInput.value || '');
    }
    if (event.key === 'Escape') {
      closeSearch();
    }
  });
}

function initChat() {
  const chatRoot = document.createElement('div');
  chatRoot.className = 'chat-widget';
  chatRoot.innerHTML = `
    <button class="chat-toggle" type="button" aria-label="Open Dhammapada chat" aria-expanded="false">
      <span aria-hidden="true">AI</span>
    </button>
    <section class="chat-panel" aria-label="Dhammapada AI chat" hidden>
      <div class="chat-panel-header">
        <div>
          <strong>Dhammapada Chat</strong>
          <span>Grounded in verse citations</span>
        </div>
        <button class="chat-close" type="button" aria-label="Close chat">&times;</button>
      </div>
      <div class="chat-messages" data-chat-messages>
        <div class="chat-message chat-message-assistant">
          Ask about a teaching, theme, Pali term, or reference like 2:12.
        </div>
      </div>
      <form class="chat-form" data-chat-form>
        <textarea class="chat-input" name="question" rows="2" placeholder="Ask about anger, mindfulness, craving..." required></textarea>
        <button class="chat-send" type="submit">Send</button>
      </form>
    </section>
  `;

  document.body.appendChild(chatRoot);

  const toggle = chatRoot.querySelector('.chat-toggle');
  const panel = chatRoot.querySelector('.chat-panel');
  const closeButton = chatRoot.querySelector('.chat-close');
  const form = chatRoot.querySelector('[data-chat-form]');
  const input = chatRoot.querySelector('.chat-input');
  const messages = chatRoot.querySelector('[data-chat-messages]');

  const setOpen = (isOpen) => {
    panel.hidden = !isOpen;
    toggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      input.focus();
    }
  };

  toggle.addEventListener('click', () => setOpen(panel.hidden));
  closeButton.addEventListener('click', () => setOpen(false));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) {
      return;
    }
    input.value = '';
    appendChatMessage(messages, question, 'user');
    const pendingMessage = appendChatMessage(messages, 'Searching the Dhammapada...', 'assistant');

    try {
      const response = await askDhammapadaChat(question);
      pendingMessage.outerHTML = renderChatAnswer(response);
    } catch (error) {
      console.warn('Chat request failed:', error);
      pendingMessage.textContent = 'The chat backend returned an error. Check the FastAPI terminal and try again.';
    }
    messages.scrollTop = messages.scrollHeight;
  });
}

function appendChatMessage(container, text, role) {
  const message = document.createElement('div');
  message.className = `chat-message chat-message-${role}`;
  message.textContent = text;
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
  return message;
}

async function askDhammapadaChat(question) {
  resetSearchApiDiscovery();
  const apiBase = await resolveSearchApiBase();
  if (!apiBase) {
    throw new Error('Chat API unavailable');
  }

  const response = await fetch(`${apiBase}/chat`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question,
      limit: 5
    })
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function renderChatAnswer(response) {
  const paragraphs = String(response.answer || '')
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');
  const citations = Array.isArray(response.citations) ? response.citations.slice(0, 5) : [];

  return `
    <div class="chat-message chat-message-assistant">
      <div class="chat-answer">${paragraphs}</div>
      ${citations.length ? `
        <div class="chat-citations">
          ${citations.map((citation) => `
            <a class="chat-citation" href="${PATHS.verse(citation.verse_id)}">
              <span>${escapeHtml(citation.title)}</span>
              <small>Score ${Number(citation.hybrid_score || 0).toFixed(2)}</small>
            </a>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function openSearch(initialValue) {
  const searchModal = document.getElementById('searchModal');
  const searchModalContent = searchModal?.querySelector('.search-modal-content');
  const searchInput = document.getElementById('searchInput');
  const searchInputWrapper = searchModal?.querySelector('.search-input-wrapper');
  if (!searchModal || !searchModalContent || !searchInput || !searchInputWrapper) {
    return;
  }

  searchModal.dataset.mode = 'search';
  searchModalContent.dataset.mode = 'search';
  searchInputWrapper.hidden = false;
  searchModal.classList.add('active');
  searchInput.value = initialValue || '';
  searchInput.focus();
  void performSearch(searchInput.value);
}

function openThemeBrowser() {
  const searchModal = document.getElementById('searchModal');
  const searchModalContent = searchModal?.querySelector('.search-modal-content');
  const searchInput = document.getElementById('searchInput');
  const searchInputWrapper = searchModal?.querySelector('.search-input-wrapper');
  const searchResults = document.getElementById('searchResults');
  if (!searchModal || !searchModalContent || !searchInput || !searchInputWrapper || !searchResults) {
    return;
  }

  const themes = getPopularThemes();
  searchModal.dataset.mode = 'themes';
  searchModalContent.dataset.mode = 'themes';
  searchInputWrapper.hidden = true;
  searchInput.value = '';
  searchModal.classList.add('active');
  renderThemeBrowser(searchResults, themes);
}

function renderThemeBrowser(container, themes) {
  container.innerHTML = `
    <div class="theme-browser-header">
      <div class="search-results-meta">Major Themes in the Dhammapada</div>
      <p class="theme-browser-copy">Browse the major themes below. The count shows how many verses currently appear under each theme.</p>
    </div>
    <div class="theme-browser-grid">
      ${themes.map((theme) => `
        <button class="theme-browser-card" type="button" data-theme-query="${escapeHtml(theme.search_query)}">
          <span class="theme-browser-label">${escapeHtml(theme.label)}</span>
          <span class="theme-browser-description">${escapeHtml(theme.description)}</span>
          <span class="theme-browser-count">${theme.count} verse${theme.count === 1 ? '' : 's'}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function closeSearch() {
  const searchModal = document.getElementById('searchModal');
  if (searchModal) {
    searchModal.classList.remove('active');
    delete searchModal.dataset.mode;
    const searchModalContent = searchModal.querySelector('.search-modal-content');
    const searchInputWrapper = searchModal.querySelector('.search-input-wrapper');
    if (searchModalContent) {
      delete searchModalContent.dataset.mode;
    }
    if (searchInputWrapper) {
      searchInputWrapper.hidden = false;
    }
  }
}

function applyDeferredSearchQuery() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (!q || (document.body.dataset.page || 'home') !== 'home') {
    return;
  }

  openSearch(q);
}

function parseVerseLookup(query) {
  const trimmed = query.trim();
  const chapterVerseMatch = trimmed.match(/^(\d+)\s*[:.\-]\s*(\d+)$/);
  if (chapterVerseMatch) {
    const chapterId = Number(chapterVerseMatch[1]);
    const verseReference = Number(chapterVerseMatch[2]);
    const chapter = state.chapterById.get(chapterId);
    if (!chapter) {
      return null;
    }
    const canonicalVerse = chapter.verses.find((item) => item.verse_number === verseReference);
    if (canonicalVerse) {
      return canonicalVerse;
    }
    return chapter.verses[verseReference - 1] || null;
  }

  const exactVerseMatch = trimmed.match(/^\d+$/);
  if (exactVerseMatch) {
    const verseNumber = Number(trimmed);
    return [...state.verseById.values()].find((item) => item.verse_number === verseNumber) || null;
  }

  return null;
}

async function performSearch(query) {
  const searchResults = document.getElementById('searchResults');
  if (!searchResults) {
    return;
  }

  const requestId = ++state.searchRequestId;

  if (!state.data) {
    searchResults.innerHTML = '<div class="search-no-results">Loading verse index...</div>';
    return;
  }

  const trimmed = query.trim();
  const directVerse = parseVerseLookup(trimmed);

  if (!trimmed) {
    searchResults.innerHTML = '<div class="search-no-results">Search by keyword or by verse reference like 1:5 or 183.</div>';
    return;
  }

  if (trimmed.length < 2 && !directVerse) {
    searchResults.innerHTML = '<div class="search-no-results">Type at least 2 characters, or use a verse reference like 1:5.</div>';
    return;
  }

  if (shouldShowRemoteSearchLoading()) {
    searchResults.innerHTML = '<div class="search-no-results">Searching verses...</div>';
  }

  const apiResults = await searchVersesWithApi(trimmed);
  if (requestId !== state.searchRequestId) {
    return;
  }

  const topResults = apiResults || searchVersesLocally(trimmed, SEARCH_RESULT_LIMIT);
  renderSearchResults(searchResults, topResults, trimmed);
}

function searchVersesLocally(query, limit = SEARCH_RESULT_LIMIT) {
  const trimmed = query.trim();
  const directVerse = parseVerseLookup(trimmed);
  const results = [];
  const lowered = trimmed.toLowerCase();

  state.verseById.forEach((verse) => {
    const searchable = [
      verse.pali,
      verse.transliteration,
      verse.translation,
      verse.commentary,
      verse.story?.title || '',
      verse.story?.content || ''
    ];
    const haystack = searchable.join(' ').toLowerCase();
    if (!haystack.includes(lowered) && directVerse?.id !== verse.id) {
      return;
    }

    let score = 0;
    if (directVerse?.id === verse.id) {
      score += 5000;
    }

    if (String(verse.verse_number) === trimmed) {
      score += 800;
    }

    if (verse.translation.toLowerCase().startsWith(lowered)) {
      score += 300;
    } else if (verse.translation.toLowerCase().includes(lowered)) {
      score += 180;
    }

    if (verse.commentary.toLowerCase().includes(lowered)) {
      score += 80;
    }

    if ((verse.story?.title || '').toLowerCase().includes(lowered)) {
      score += 70;
    }

    if (verse.transliteration.toLowerCase().includes(lowered) || verse.pali.toLowerCase().includes(lowered)) {
      score += 120;
    }

    if (verse.is_popular) {
      score += 20;
    }

    results.push({
      verse_id: verse.id,
      chapter_id: verse.chapter_id,
      chapter_name: verse.chapter_name,
      verse_number: verse.verse_number,
      excerpt: buildSearchSnippet(verse, trimmed),
      score
    });
  });

  results.sort((left, right) => right.score - left.score || left.verse_number - right.verse_number);
  return results.slice(0, limit);
}

function renderSearchResults(container, results, query) {
  if (results.length === 0) {
    container.innerHTML = `<div class="search-no-results">No verses matched "${escapeHtml(query)}".</div>`;
    return;
  }

  container.innerHTML = `
    <div class="search-results-meta">${results.length} result${results.length === 1 ? '' : 's'}</div>
    ${results.map((item) => {
      return `
        <a class="search-result-item" href="${PATHS.verse(item.verse_id)}">
          <div class="search-result-head">
            <div class="search-result-chapter">Chapter ${item.chapter_id}: ${escapeHtml(item.chapter_name)}</div>
            <div class="search-result-reference">Verse ${item.verse_number}</div>
          </div>
          <div class="search-result-text">${highlightText(item.excerpt, query)}</div>
        </a>
      `;
    }).join('')}
  `;
}

function buildSearchSnippet(verse, query) {
  const sources = [
    verse.translation,
    verse.commentary,
    verse.story?.title || '',
    verse.story?.content || ''
  ];
  const source = sources.find((item) => item.toLowerCase().includes(query.toLowerCase())) || verse.translation;
  return excerptAroundMatch(source, query, 140);
}

function getSearchApiCandidates() {
  const candidates = [];
  const origin = window.location.origin;
  
  // 1. Prioritize the current origin (essential for Vercel deployment)
  if (origin && origin !== 'null') {
    candidates.push(`${origin}/api`);
  }

  // 2. Only add local development candidates if we are actually working locally
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    candidates.push(
      'http://127.0.0.1:8001/api',
      'http://localhost:8001/api',
      'http://127.0.0.1:8000/api',
      'http://localhost:8000/api'
    );
  }
  
  return [...new Set(candidates)];
}

function shouldShowRemoteSearchLoading() {
  return Boolean(state.searchApiBase) || Date.now() - state.searchApiCheckedAt >= SEARCH_API_CACHE_TTL_MS;
}

async function resolveSearchApiBase() {
  if (Date.now() - state.searchApiCheckedAt < SEARCH_API_CACHE_TTL_MS) {
    return state.searchApiBase;
  }

  for (const candidate of getSearchApiCandidates()) {
    try {
      const response = await fetch(`${candidate}/health`, { cache: 'no-store' });
      if (!response.ok) {
        continue;
      }
      state.searchApiBase = candidate;
      state.searchApiCheckedAt = Date.now();
      return candidate;
    } catch (error) {
      console.warn(`Search API probe failed for ${candidate}:`, error);
    }
  }

  state.searchApiBase = null;
  state.searchApiCheckedAt = Date.now();
  return null;
}

function resetSearchApiDiscovery() {
  state.searchApiBase = null;
  state.searchApiCheckedAt = 0;
}

async function searchVersesWithApi(query) {
  const apiBase = await resolveSearchApiBase();
  if (!apiBase) {
    return null;
  }

  const params = new URLSearchParams({
    q: query,
    limit: String(SEARCH_RESULT_LIMIT)
  });

  try {
    const response = await fetch(`${apiBase}/search?${params.toString()}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Search API request failed, using local fallback:', error);
    resetSearchApiDiscovery();
    return null;
  }
}

function excerptAroundMatch(text, query, length) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  const index = clean.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1 || clean.length <= length) {
    return truncateText(clean, length);
  }

  const start = Math.max(index - Math.floor(length / 3), 0);
  const end = Math.min(start + length, clean.length);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < clean.length ? '...' : '';
  return `${prefix}${clean.slice(start, end).trim()}${suffix}`;
}

function highlightText(text, query) {
  const escapedText = escapeHtml(text);
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'ig');
  return escapedText.replace(regex, '<mark>$1</mark>');
}

function applyQuoteThemeFilter(theme) {
  if ((document.body.dataset.page || '') !== 'quotes') {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (theme) {
    params.set('theme', theme);
  } else {
    params.delete('theme');
  }

  const nextUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
  window.history.replaceState({}, '', nextUrl);
  renderQuotesPage();
}

function toggleAccordion(button) {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  const nextState = !expanded;
  button.setAttribute('aria-expanded', String(nextState));
  button.classList.toggle('active', nextState);
  const symbol = button.querySelector('.accordion-plus');
  if (symbol) {
    symbol.textContent = nextState ? '-' : '+';
  }

  const panel = button.nextElementSibling;
  if (panel) {
    if (panel.classList.contains('accordion-content')) {
      panel.classList.toggle('active', nextState);
    } else {
      panel.classList.toggle('open', nextState);
    }
  }
}

function updatePageMeta({ title, description, type, schema }) {
  document.title = title;
  setMetaByName('description', description);
  setMetaByName('keywords', 'Dhammapada, Buddhism, Pali, Buddha teachings, verses');
  setMetaByProperty('og:title', title);
  setMetaByProperty('og:description', description);
  setMetaByProperty('og:type', type || 'website');
  setMetaByProperty('og:url', window.location.href);
  setMetaByProperty('og:image', absoluteUrl(assetPath('images/buddha.jpg')));
  setMetaByName('twitter:title', title);
  setMetaByName('twitter:description', description);
  setMetaByName('twitter:image', absoluteUrl(assetPath('images/buddha.jpg')));

  const canonicalLink = document.getElementById('canonicalLink');
  if (canonicalLink) {
    canonicalLink.href = window.location.href;
  }

  const structuredData = document.getElementById('structuredData');
  if (structuredData) {
    structuredData.textContent = JSON.stringify(schema, null, 2);
  }
}

function setMetaByName(name, content) {
  const meta = document.head.querySelector(`meta[name="${name}"]`);
  if (meta) {
    meta.setAttribute('content', content);
  }
}

function setMetaByProperty(property, content) {
  const meta = document.head.querySelector(`meta[property="${property}"]`);
  if (meta) {
    meta.setAttribute('content', content);
  }
}

function initScrollFeatures() {
  const progressBar = document.createElement('div');
  progressBar.className = 'reading-progress';
  document.body.prepend(progressBar);

  window.addEventListener('scroll', () => {
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = documentHeight > 0 ? (window.scrollY / documentHeight) * 100 : 0;
    progressBar.style.width = `${Math.min(progress, 100)}%`;

    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.classList.toggle('scrolled', window.scrollY > 24);
    }
  });
}

function initScrollToTop() {
  const button = document.createElement('button');
  button.className = 'scroll-to-top';
  button.type = 'button';
  button.innerHTML = `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
    </svg>
  `;
  button.setAttribute('aria-label', 'Scroll to top');
  document.body.appendChild(button);

  window.addEventListener('scroll', () => {
    button.classList.toggle('visible', window.scrollY > 320);
  });

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function markActiveNav() {
  const page = document.body.dataset.page || 'home';
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const isActive = link.dataset.nav === page;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

function setCurrentYear() {
  document.querySelectorAll('.current-year').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
}

function absoluteUrl(relativePath) {
  return new URL(relativePath, window.location.href).href;
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove('visible');
  }, 2200);
}

function formatMultilineText(text) {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function truncateText(text, length) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= length) {
    return clean;
  }
  return `${clean.slice(0, length - 1).trim()}...`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

