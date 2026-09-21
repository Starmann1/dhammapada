/**
 * @module render
 * Shared rendering utilities and template helpers
 */
import { paths } from './router.js';
import { isBookmarked } from './store.js';

/** Get the main content container */
export function getPageContent() {
  return document.getElementById('pageContent');
}

/** Escape HTML special characters */
export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Strip HTML tags from a string */
export function stripTags(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
}

/** Render loading state */
export function renderLoading(message = 'Loading...') {
  const content = getPageContent();
  if (content) {
    content.innerHTML = `
      <div class="state-loading">
        <div class="spinner"></div>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }
}

/** Render error state */
export function renderError(message = 'Something went wrong.') {
  const content = getPageContent();
  if (content) {
    content.innerHTML = `
      <div class="state-error">
        <p>${escapeHtml(message)}</p>
        <a href="${paths.home()}" class="btn btn-secondary">Return home</a>
      </div>
    `;
  }
}

/** Render empty state */
export function renderEmpty(message, actionHtml = '') {
  return `
    <div class="state-empty">
      <p>${escapeHtml(message)}</p>
      ${actionHtml}
    </div>
  `;
}

/** Render breadcrumb navigation */
export function renderBreadcrumb(items) {
  if (!items || !items.length) return '';
  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      ${items.map((item, i) => {
        const isLast = i === items.length - 1;
        if (isLast) return `<span>${escapeHtml(item.label)}</span>`;
        return `<a href="${item.href}">${escapeHtml(item.label)}</a><span class="breadcrumb-separator" aria-hidden="true">/</span>`;
      }).join('')}
    </nav>
  `;
}

/** Render theme chips/pills */
export function renderThemeChips(themeIds, options = {}) {
  if (!themeIds?.length) return '';
  return `
    <div class="flex" style="flex-wrap:wrap;gap:var(--space-2);${options.marginTop ? 'margin-top:var(--space-4)' : ''}">
      ${themeIds.map(id => {
        const label = id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `<a href="${paths.theme(id)}" class="chip">${escapeHtml(label)}</a>`;
      }).join('')}
    </div>
  `;
}

/** Render a compact verse card for lists */
export function renderVerseCard(verse) {
  if (!verse) return '';
  const translation = stripTags(verse.translation || '');
  const excerpt = translation.length > 120 ? translation.slice(0, 120) + '...' : translation;
  return `
    <a href="${paths.verse(verse.id)}" class="surface surface--interactive" style="display:block;text-decoration:none;margin-bottom:var(--space-3);">
      <div style="display:flex;gap:var(--space-4);align-items:flex-start;">
        <span class="verse-list-number">${verse.verse_number || ''}</span>
        <div style="flex:1;min-width:0;">
          <span style="font-size:var(--font-size-xs);color:var(--fg-subtle);">${escapeHtml(verse.chapter_name || '')}</span>
          <p style="margin:var(--space-1) 0 0;font-family:var(--font-serif);font-size:var(--font-size-sm);color:var(--fg-muted);line-height:var(--leading-normal);">${escapeHtml(excerpt)}</p>
          ${verse.themes?.length ? `<div style="margin-top:var(--space-2);display:flex;gap:var(--space-1);flex-wrap:wrap;">${verse.themes.slice(0, 3).map(t => `<span class="chip" style="font-size:0.65rem;padding:1px 6px;pointer-events:none;">${t.replace(/-/g, ' ')}</span>`).join('')}</div>` : ''}
        </div>
      </div>
    </a>
  `;
}

/** Render bookmark/save button for a verse */
export function renderBookmarkButton(verseId, options = {}) {
  const saved = isBookmarked(verseId);
  const size = options.size || 20;
  return `
    <button class="btn-icon" data-action="bookmark" data-verse-id="${escapeHtml(String(verseId))}" 
            aria-pressed="${saved}" aria-label="${saved ? 'Remove from saved' : 'Save verse'}" title="${saved ? 'Saved' : 'Save'}">
      <svg width="${size}" height="${size}" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
      </svg>
    </button>
  `;
}

/** Update document meta tags for SEO */
export function updatePageMeta({ title, description, type, schema }) {
  if (title) document.title = title;
  if (description) {
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  }
  if (title) {
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  }
  if (type) {
    document.querySelector('meta[property="og:type"]')?.setAttribute('content', type);
  }
  if (schema) {
    const el = document.getElementById('structuredData');
    if (el) el.textContent = JSON.stringify(schema);
  }
}

/** Show a toast notification */
export function showToast(message, duration = 2500) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('visible'), duration);
}
