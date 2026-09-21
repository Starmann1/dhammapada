/**
 * @module app
 * Main application entry point
 */
import { loadData, applyTheme, getThemePreference, toggleTheme, toggleBookmark } from './modules/store.js';
import { getCurrentPage, isStaticPage } from './modules/router.js';
import { renderLoading, renderError, showToast } from './modules/render.js';
import { initSearch } from './modules/search.js';
import { initFocus } from './modules/focus.js';

// Page renderers (dynamic import based on page)
const PAGE_RENDERERS = {
  home: () => import('./modules/pages/home.js'),
  chapters: () => import('./modules/pages/chapters.js'),
  chapter: () => import('./modules/pages/chapter.js'),
  verse: () => import('./modules/pages/verse.js'),
  quotes: () => import('./modules/pages/quotes.js'),
  theme: () => import('./modules/pages/themes.js'),
  faq: () => import('./modules/pages/faq.js'),
  about: () => import('./modules/pages/about.js'),
  saved: () => import('./modules/pages/saved.js'),
  ai: () => import('./modules/pages/ai.js'),
  characters: () => import('./modules/pages/characters.js'),
};

async function init() {
  // Apply saved theme immediately
  applyTheme(getThemePreference());
  
  // Init global UI
  initSearch();
  initFocus();
  initThemeToggle();
  initActiveNav();
  initGlobalActions();
  
  // For static pages, load data in background so search palette works
  if (isStaticPage()) {
    loadData();
    return;
  }
  
  // Show loading, load data, render page
  const pageContent = document.getElementById('pageContent');
  if (!pageContent) return;

  renderLoading('Loading the Dhammapada...');
  await loadData();

  // Check for data loading errors
  const { getError } = await import('./modules/store.js');
  if (getError()) {
    renderError('Failed to load data. Please refresh the page.');
    return;
  }
  
  const page = getCurrentPage();
  const renderer = PAGE_RENDERERS[page];
  if (renderer) {
    try {
      const module = await renderer();
      if (module.render) {
        const html = module.render();
        // If render returns HTML string, write it to pageContent
        if (typeof html === 'string') {
          pageContent.innerHTML = html;
        }
        // If render returns nothing, assume it wrote to DOM directly
        // Run any post-render setup
        if (module.afterRender) {
          module.afterRender();
        }
      }
    } catch (err) {
      console.error('Page render error:', err);
      renderError('Failed to render page.');
    }
  }
}

function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  btn?.addEventListener('click', () => {
    toggleTheme();
    showToast(getThemePreference() === 'dark' ? 'Dark mode' : 'Light mode');
  });
}

function initActiveNav() {
  const page = getCurrentPage();
  // Map page to nav data attribute
  const navMap = {
    home: 'home', chapters: 'chapters', chapter: 'chapters',
    verse: 'home', quotes: 'quotes', theme: 'chapters',
    faq: 'about', about: 'about', saved: 'saved',
    ai: 'ai', characters: 'about',
  };
  const activeNav = navMap[page] || '';
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.classList.toggle('active', el.dataset.nav === activeNav);
  });
}

function initGlobalActions() {
  // Delegated click handler for bookmarks and other global actions
  document.addEventListener('click', (e) => {
    const bookmarkBtn = e.target.closest('[data-action="bookmark"]');
    if (bookmarkBtn) {
      e.preventDefault();
      e.stopPropagation();
      const verseId = bookmarkBtn.dataset.verseId;
      const saved = toggleBookmark(verseId);
      showToast(saved ? 'Verse saved' : 'Verse removed');
      // Update all bookmark buttons for this verse
      document.querySelectorAll(`[data-action="bookmark"][data-verse-id="${verseId}"]`).forEach(btn => {
        btn.setAttribute('aria-pressed', saved);
        btn.setAttribute('aria-label', saved ? 'Remove from saved' : 'Save verse');
        btn.setAttribute('title', saved ? 'Saved' : 'Save');
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', saved ? 'currentColor' : 'none');
      });
    }
  });
}

// Start
document.addEventListener('DOMContentLoaded', init);
