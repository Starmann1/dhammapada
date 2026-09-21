import { getAllChapters, getAllThemes } from '../store.js';
import { paths } from '../router.js';
import { renderThemeChips, updatePageMeta } from '../render.js';

/**
 * Renders the Chapters index page.
 * @returns {string} HTML content
 */
export function render() {
  updatePageMeta({
    title: 'Chapters — The Dhammapada',
    description: 'Explore the 26 chapters and 423 verses of the classical Dhammapada.'
  });

  const chapters = getAllChapters();
  const themes = getAllThemes();

  return `
    <div class="container reading-column" style="padding-top: var(--space-6); padding-bottom: var(--space-16);">
      <div class="page-header" style="margin-bottom: var(--space-8);">
        <div class="eyebrow text-accent">CANONICAL DIVISIONS</div>
        <h1>Chapters</h1>
        <p class="text-serif text-muted" style="margin-top: var(--space-2); font-size: var(--font-size-lg); line-height: var(--leading-relaxed);">
          The classical Dhammapada is organized into 26 vaggas (chapters), each illuminating a central facet of ethical and mental cultivation.
        </p>
      </div>

      <div style="margin-bottom: var(--space-10);">
        <div class="text-xs text-subtle" style="text-transform: uppercase; letter-spacing: var(--tracking-wider); margin-bottom: var(--space-2); font-weight: 600;">
          Filter by Theme
        </div>
        ${renderThemeChips(themes.map(t => t.id))}
      </div>

      <div class="chapter-list" role="list">
        ${chapters.map(ch => `
          <a href="${paths.chapter(ch.id)}" class="chapter-list-item" role="listitem">
            <span class="chapter-list-number">${String(ch.id).padStart(2, '0')}</span>
            <div class="chapter-list-info">
              <div class="chapter-list-name">${ch.name_en}</div>
              <div class="chapter-list-pali">${ch.name_pali}</div>
              <p class="text-serif text-muted" style="font-size: var(--font-size-sm); margin: var(--space-2) 0 var(--space-2); line-height: var(--leading-normal);">
                ${ch.short_summary || ch.summary}
              </p>
              ${ch.themes?.length ? `
                <div style="margin-top: var(--space-2); pointer-events: none;">
                  ${ch.themes.slice(0, 3).map(t => `<span class="chip" style="font-size: 0.65rem; padding: 1px 6px; margin-right: 4px;">${t.replace(/-/g, ' ')}</span>`).join('')}
                </div>
              ` : ''}
            </div>
            <div class="chapter-list-meta" style="white-space: nowrap; margin-left: var(--space-4);">
              ${ch.verses ? ch.verses.length : 0} verses
            </div>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}
