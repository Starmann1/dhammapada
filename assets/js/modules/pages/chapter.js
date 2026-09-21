/**
 * @module pages/chapter
 * Chapter detail page with summary and verses list
 */
import { getChapter } from '../store.js';
import { getParam, paths } from '../router.js';
import { renderBreadcrumb, renderThemeChips, renderEmpty, updatePageMeta, stripTags } from '../render.js';

/**
 * Renders the Chapter detail page.
 * @returns {string} HTML content
 */
export function render() {
  const id = parseInt(getParam('id'), 10);
  const chapter = getChapter(id);

  if (!chapter) {
    return renderEmpty(
      'Chapter not found',
      `<p class="text-muted" style="margin-top:1rem;">The requested chapter (${escapeHtml(String(id || ''))}) could not be located.</p>
       <div style="margin-top:1.5rem;"><a href="${paths.chapters()}" class="btn btn-secondary">Browse all chapters</a></div>`
    );
  }

  updatePageMeta({
    title: `Chapter ${id}: ${chapter.name_en} (${chapter.name_pali}) — The Dhammapada`,
    description: chapter.short_summary || chapter.summary
  });

  const nextChapter = getChapter(id + 1);
  const prevChapter = getChapter(id - 1);

  return `
    <div class="container reading-column" style="padding-top: var(--space-6); padding-bottom: var(--space-16);">
      ${renderBreadcrumb([
        { label: 'Read', href: paths.home() },
        { label: 'Chapters', href: paths.chapters() },
        { label: chapter.name_en }
      ])}

      <div class="page-header" style="margin-top: var(--space-6); margin-bottom: var(--space-10);">
        <div class="eyebrow" style="margin-bottom: var(--space-2);">CHAPTER ${chapter.id}</div>
        <h1 style="font-size: var(--font-size-3xl); margin-bottom: var(--space-2);">${chapter.name_en}</h1>
        <div class="text-italic text-serif text-muted" style="font-size: var(--font-size-xl); margin-bottom: var(--space-4);">${chapter.name_pali}</div>
        
        <p class="text-serif" style="font-size: var(--font-size-base); line-height: var(--leading-relaxed); color: var(--fg); margin-bottom: var(--space-4);">
          ${chapter.summary}
        </p>

        ${chapter.themes?.length ? `
          <div style="margin-top: var(--space-4);">
            ${renderThemeChips(chapter.themes)}
          </div>
        ` : ''}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: var(--space-10); margin-bottom: var(--space-4); border-bottom: 1px solid var(--border); padding-bottom: var(--space-2);">
        <h2 class="section-heading" style="margin: 0; font-size: var(--font-size-xl);">Verses</h2>
        <span class="text-xs text-subtle">${chapter.verses ? chapter.verses.length : 0} verses</span>
      </div>

      <div class="verse-list" role="list">
        ${(chapter.verses || []).map(v => {
          const translation = stripTags(v.translation || '');
          return `
            <a href="${paths.verse(v.id)}" class="verse-list-item" role="listitem">
              <span class="verse-list-number">${v.verse_number}</span>
              <div style="flex: 1; min-width: 0;">
                <div class="verse-list-text text-serif">${translation}</div>
                ${v.is_popular ? `<span class="verse-list-popular" style="display:inline-block;margin-top:var(--space-1);">&#9733; Often read</span>` : ''}
              </div>
            </a>
          `;
        }).join('')}
      </div>

      <nav class="verse-nav" style="display: flex; justify-content: space-between; margin-top: var(--space-12); padding-top: var(--space-6); border-top: 1px solid var(--border);" aria-label="Chapter navigation">
        ${prevChapter ? `
          <a href="${paths.chapter(prevChapter.id)}" class="btn btn-ghost" style="text-align: left; text-decoration: none;">
            <span class="text-xs text-subtle" style="display:block;">&larr; Previous Chapter</span>
            <span class="text-serif" style="color:var(--fg);">${prevChapter.name_en}</span>
          </a>
        ` : '<div></div>'}

        ${nextChapter ? `
          <a href="${paths.chapter(nextChapter.id)}" class="btn btn-ghost" style="text-align: right; text-decoration: none;">
            <span class="text-xs text-subtle" style="display:block;">Next Chapter &rarr;</span>
            <span class="text-serif" style="color:var(--fg);">${nextChapter.name_en}</span>
          </a>
        ` : '<div></div>'}
      </nav>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
