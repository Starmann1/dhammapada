/**
 * @module store
 * Central state management for The Dhammapada
 */

// === State ===
const state = {
  data: null,
  chapterById: new Map(),
  verseById: new Map(),
  themeById: new Map(),
  loading: true,
  error: null,
};

// === Event Bus ===
const listeners = new Map();

/**
 * Register an event listener
 * @param {string} event 
 * @param {Function} callback 
 */
export function on(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);
}

/**
 * Emit an event
 * @param {string} event 
 * @param {any} data 
 */
export function emit(event, data) {
  if (listeners.has(event)) {
    listeners.get(event).forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error(`Error in event listener for ${event}:`, err);
      }
    });
  }
}

// === Data Loading ===
/** Determine data path based on current page location */
function getDataPath() {
  const isInPages = window.location.pathname.includes('/pages/');
  return isInPages ? '../data/dhammapada.json' : 'data/dhammapada.json';
}

/** Load the complete dataset and build lookup indices */
export async function loadData() {
  try {
    state.loading = true;
    const res = await fetch(getDataPath());
    if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
    state.data = await res.json();
    buildIndices();
    state.loading = false;
    state.error = null;
    emit('dataLoaded', state.data);
  } catch (err) {
    state.error = err.message;
    state.loading = false;
    emit('dataError', err);
  }
}

function buildIndices() {
  state.chapterById.clear();
  state.verseById.clear();
  state.themeById.clear();

  state.data.chapters.forEach(ch => {
    state.chapterById.set(ch.id, ch);
    ch.verses.forEach(v => state.verseById.set(v.id, v));
  });
  if (state.data.theme_definitions) {
    state.data.theme_definitions.forEach(t => state.themeById.set(t.id, t));
  }
}

// === Getters ===
export function getData() { return state.data; }
export function getChapter(id) { return state.chapterById.get(Number(id)); }
export function getVerse(id) { return state.verseById.get(String(id)); }
export function getTheme(id) { return state.themeById.get(String(id)); }
export function getAllChapters() { return state.data?.chapters || []; }
export function getAllThemes() { return state.data?.theme_definitions || []; }
export function getQuotes() { return state.data?.quotes || []; }
export function getFaqs() { return state.data?.faqs || []; }
export function getAbout() { return state.data?.about || null; }
export function getSite() { return state.data?.site || null; }
export function getCharacters() { return state.data?.characters || []; }
export function getFeaturedVerseIds() { return state.data?.featured_verse_ids || []; }
export function isLoading() { return state.loading; }
export function getError() { return state.error; }

// === Verse of the Day ===
export function getVerseOfTheDay() {
  const seeds = state.data?.verse_of_the_day_seed || [];
  if (!seeds.length) return null;
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const id = seeds[dayOfYear % seeds.length];
  return state.verseById.get(id) || null;
}

// === Theme Persistence ===
export function getThemePreference() {
  const stored = localStorage.getItem('dhp-theme');
  return stored || 'dark';
}

export function setThemePreference(theme) {
  localStorage.setItem('dhp-theme', theme);
  applyTheme(theme);
  emit('themeChange', theme);
}

export function toggleTheme() {
  const current = getThemePreference();
  setThemePreference(current === 'dark' ? 'light' : 'dark');
}

export function applyTheme(theme) {
  document.body.classList.toggle('light-mode', theme === 'light');
}

// === Bookmarks ===
const BOOKMARKS_KEY = 'dhp-bookmarks';

export function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY)) || [];
  } catch { return []; }
}

export function isBookmarked(verseId) {
  return getBookmarks().includes(String(verseId));
}

export function toggleBookmark(verseId) {
  const id = String(verseId);
  let bookmarks = getBookmarks();
  if (bookmarks.includes(id)) {
    bookmarks = bookmarks.filter(b => b !== id);
  } else {
    bookmarks.push(id);
  }
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  emit('bookmarkChange', { id, bookmarks });
  return bookmarks.includes(id);
}

// === Last Read ===
export function setLastRead(verseId) {
  localStorage.setItem('dhp-last-read', String(verseId));
}

export function getLastRead() {
  return localStorage.getItem('dhp-last-read');
}

// === Verse Navigation ===
/** Get the next verse after the given ID, or null */
export function getNextVerse(verseId) {
  const verse = getVerse(verseId);
  if (!verse) return null;
  const chapter = getChapter(verse.chapter_id);
  if (!chapter) return null;
  const idx = chapter.verses.findIndex(v => v.id === verseId);
  if (idx < chapter.verses.length - 1) return chapter.verses[idx + 1];
  
  // Next chapter's first verse
  const nextChapter = getChapter(verse.chapter_id + 1);
  return nextChapter?.verses[0] || null;
}

/** Get the previous verse before the given ID, or null */
export function getPrevVerse(verseId) {
  const verse = getVerse(verseId);
  if (!verse) return null;
  const chapter = getChapter(verse.chapter_id);
  if (!chapter) return null;
  const idx = chapter.verses.findIndex(v => v.id === verseId);
  if (idx > 0) return chapter.verses[idx - 1];
  
  // Prev chapter's last verse
  const prevChapter = getChapter(verse.chapter_id - 1);
  return prevChapter?.verses[prevChapter.verses.length - 1] || null;
}
