/**
 * @module router
 * Page detection and path resolution
 */

const IS_PAGES_DIR = window.location.pathname.includes('/pages/');

/** Get the current page type from body data attribute */
export function getCurrentPage() {
  return document.body.dataset.page || 'home';
}

/** Parse URL query parameters */
export function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Build paths relative to current location */
export const paths = {
  home: () => IS_PAGES_DIR ? '../index.html' : 'index.html',
  chapters: () => IS_PAGES_DIR ? 'chapters.html' : 'pages/chapters.html',
  chapter: (id) => (IS_PAGES_DIR ? 'chapter.html' : 'pages/chapter.html') + '?id=' + id,
  verse: (id) => (IS_PAGES_DIR ? 'verse.html' : 'pages/verse.html') + '?id=' + id,
  quotes: () => IS_PAGES_DIR ? 'quotes.html' : 'pages/quotes.html',
  theme: (id) => (IS_PAGES_DIR ? 'theme.html' : 'pages/theme.html') + (id ? '?id=' + id : ''),
  themes: () => IS_PAGES_DIR ? 'theme.html' : 'pages/theme.html',
  faq: () => IS_PAGES_DIR ? 'faq.html' : 'pages/faq.html',
  about: () => IS_PAGES_DIR ? 'about.html' : 'pages/about.html',
  saved: () => IS_PAGES_DIR ? 'saved.html' : 'pages/saved.html',
  ai: () => IS_PAGES_DIR ? 'dhamma-ai.html' : 'pages/dhamma-ai.html',
  characters: () => IS_PAGES_DIR ? 'characters.html' : 'pages/characters.html',
  credits: () => IS_PAGES_DIR ? 'credits.html' : 'pages/credits.html',
  image: (name) => IS_PAGES_DIR ? `../assets/images/${name}` : `assets/images/${name}`,
};

/** Check if current body has static content (like credits page) */
export function isStaticPage() {
  return document.body.dataset.static === 'true';
}
