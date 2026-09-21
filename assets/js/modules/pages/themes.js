/**
 * @module pages/themes
 * Themes index and single theme detail view
 */
import { getTheme, getAllThemes, getAllChapters } from '../store.js';
import { getParam, paths } from '../router.js';
import { updatePageMeta, stripTags, renderEmpty } from '../render.js';

/**
 * Renders the Themes page or a single Theme view
 * @returns {string} HTML content
 */
export function render() {
  const id = getParam('id');

  if (!id) {
    updatePageMeta({
      title: 'Themes — The Dhammapada',
      description: 'Explore the core doctrinal and ethical themes running through the Dhammapada.'
    });

    const themes = getAllThemes();

    return `
      <div class="container reading-column" style="padding-top: var(--space-6); padding-bottom: var(--space-16);">
        <div class="page-header" style="margin-bottom: var(--space-8);">
          <div class="eyebrow text-accent">DOCTRINAL PATHS</div>
          <h1>Themes</h1>
          <p class="text-serif text-muted" style="margin-top: var(--space-2); font-size: var(--font-size-lg); line-height: var(--leading-relaxed);">
            Key threads of the Buddha’s path, classified to aid reflective study and daily practice.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-4);">
          ${themes.map(t => `
            <a href="${paths.theme(t.id)}" class="surface surface--interactive" style="display: flex; flex-direction: column; text-decoration: none; color: inherit; padding: var(--space-6);">
              <h2 style="font-size: var(--font-size-xl); margin-bottom: var(--space-2); text-transform: capitalize; color: var(--fg);">
                ${t.label || t.id}
              </h2>
              <p class="text-serif text-muted" style="font-size: var(--font-size-sm); line-height: var(--leading-normal); margin-bottom: var(--space-4); flex: 1;">
                ${t.description}
              </p>
              <div class="text-xs text-accent" style="font-weight: 500; font-family: var(--font-sans);">
                Explore verses &rarr;
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  const theme = getTheme(id);
  if (!theme) {
    return renderEmpty(
      'Theme not found',
      `<p class="text-muted" style="margin-top:1rem;">The theme "${escapeHtml(id)}" does not exist.</p>
       <div style="margin-top:1.5rem;"><a href="${paths.themes()}" class="btn btn-secondary">Browse all themes</a></div>`
    );
  }

  updatePageMeta({
    title: `${theme.label || theme.id} — Themes — The Dhammapada`,
    description: theme.description
  });

  // Collect verses matching this theme
  const chapters = getAllChapters();
  const verses = [];
  chapters.forEach(ch => {
    (ch.verses || []).forEach(v => {
      if (v.themes && v.themes.includes(theme.id)) {
        verses.push({ verse: v, chapter: ch });
      }
    });
  });

  return `
    <div class="container reading-column" style="padding-top: var(--space-6); padding-bottom: var(--space-16);">
      <div class="page-header" style="margin-bottom: var(--space-10);">
        <div class="eyebrow text-accent">THEME</div>
        <h1 style="text-transform: capitalize; margin-bottom: var(--space-2);">${theme.label || theme.id}</h1>
        <p class="text-serif" style="font-size: var(--font-size-lg); line-height: var(--leading-relaxed); color: var(--fg); margin-top: var(--space-2);">
          ${theme.description}
        </p>
        <div class="text-sm text-subtle" style="margin-top: var(--space-3);">
          ${verses.length} verses indexed under this theme
        </div>
      </div>

      <div class="verse-list" role="list">
        ${verses.map(({ verse: v, chapter: ch }) => {
          const translation = stripTags(v.translation || '');
          return `
            <a href="${paths.verse(v.id)}" class="verse-list-item" role="listitem">
              <span class="verse-list-number">${v.verse_number}</span>
              <div style="flex: 1; min-width: 0;">
                <div class="verse-list-text text-serif">${translation}</div>
                <div class="text-xs text-subtle" style="margin-top: var(--space-1);">
                  ${ch.name_en} &middot; Chapter ${ch.id}
                </div>
              </div>
            </a>
          `;
        }).join('')}
      </div>

      <div style="margin-top: var(--space-12); text-align: center;">
        <a href="${paths.themes()}" class="btn btn-ghost">&larr; Browse all themes</a>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
