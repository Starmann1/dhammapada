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
  allVersesCache = null;

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

let allVersesCache = null;
export function getAllVerses() {
  if (allVersesCache && allVersesCache.length > 0) return allVersesCache;
  if (!state.data?.chapters) return [];
  allVersesCache = [];
  state.data.chapters.forEach(ch => {
    if (Array.isArray(ch.verses)) {
      allVersesCache.push(...ch.verses);
    }
  });
  return allVersesCache;
}

export function getQuotes() { return state.data?.quotes || []; }
export function getFaqs() { return state.data?.faqs || []; }
export function getAbout() { return state.data?.about || null; }
export function getSite() { return state.data?.site || null; }
export function getCharacters() { return state.data?.characters || []; }
export function getFeaturedVerseIds() { return state.data?.featured_verse_ids || []; }
export function isLoading() { return state.loading; }
export function getError() { return state.error; }

// === Verse of the Day ===
/**
 * Returns a unique, inspiring verse for each calendar day of the year.
 * Rotates deterministically across all 423 verses of the Dhammapada using
 * a coprime step generator (step=137, gcd(137, 423)=1) to guarantee:
 *  1. Every single day of the year (365/366 days) displays a distinct verse.
 *  2. Consecutive days gracefully cycle across different chapters and themes.
 *  3. Year offset ensures year-over-year variety.
 * 
 * @param {Date|string|number} [targetDate=new Date()]
 * @returns {object|null}
 */
export function getVerseOfTheDay(targetDate = new Date()) {
  const now = targetDate instanceof Date ? targetDate : new Date(targetDate || Date.now());
  const allVerses = getAllVerses();

  // Exact midnight-to-midnight local day of year (1-indexed: 1..366)
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const currentDay = new Date(year, now.getMonth(), now.getDate());
  const dayOfYear = Math.round((currentDay - startOfYear) / 86400000) + 1;

  if (allVerses.length > 0) {
    const total = allVerses.length;
    const yearOffset = (year * 37) % total;
    const verseIndex = (yearOffset + (dayOfYear - 1) * 137) % total;
    return allVerses[verseIndex] || allVerses[0];
  }

  // Fallback to verse_of_the_day_seed array if chapters not fully flattened yet
  const seeds = state.data?.verse_of_the_day_seed || [];
  if (seeds.length > 0) {
    const id = seeds[(dayOfYear - 1) % seeds.length];
    return state.verseById.get(id) || null;
  }

  return null;
}

/**
 * Returns formatted date string for Verse of the Day header (e.g. "SEP 21")
 * @param {Date|string|number} [targetDate=new Date()]
 * @returns {string}
 */
export function getVerseOfTheDayDateString(targetDate = new Date()) {
  const now = targetDate instanceof Date ? targetDate : new Date(targetDate || Date.now());
  return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
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
