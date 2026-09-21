/**
 * @module pages/quotes
 * Contemplative quotes selection from the Dhammapada
 */
import { getQuotes, getChapter, getVerse } from '../store.js';
import { paths } from '../router.js';
import { updatePageMeta, stripTags } from '../render.js';

/**
 * Renders the Quotes page.
 * @returns {string} HTML content
 */
export function render() {
  updatePageMeta({
    title: 'Quotes — The Dhammapada',
    description: 'Timeless words of the Buddha on mind, wisdom, vigilance, and compassion.'
  });

  const quotes = getQuotes();

  return `
    <div class="container reading-column" style="padding-top: var(--space-6); padding-bottom: var(--space-16);">
      <div class="page-header" style="margin-bottom: var(--space-10);">
        <div class="eyebrow text-accent">WORDS OF THE AWAKENED ONE</div>
        <h1>Quotes</h1>
        <p class="text-serif text-muted" style="margin-top: var(--space-2); font-size: var(--font-size-lg); line-height: var(--leading-relaxed);">
          Short, powerful verses distilled from centuries of contemplation.
        </p>
      </div>

      <div style="display: flex; flex-direction: column;">
        ${quotes.map(q => {
          const verse = getVerse(q.verse_id);
          const ch = getChapter(q.chapter_id);
          const chName = ch ? ch.name_en : (verse ? verse.chapter_name : `Chapter ${q.chapter_id}`);
          const verseNum = verse ? verse.verse_number : (q.verse_id ? q.verse_id.split('-')[1] : '');

          return `
            <blockquote class="quote-card" style="margin: 0;">
              <p class="quote-text">
                &ldquo;${stripTags(q.text || q.excerpt || '')}&rdquo;
              </p>
              <cite class="quote-attribution" style="display: block; font-style: normal;">
                &mdash; <a href="${paths.verse(q.verse_id)}" class="text-accent" style="text-decoration: none;" title="Read full verse with commentary">
                  Dhammapada ${verseNum} &middot; ${chName}
                </a>
                ${q.theme ? `<span class="chip" style="margin-left: var(--space-3); font-size: 0.65rem; padding: 1px 6px; pointer-events: none;">${q.theme.replace(/-/g, ' ')}</span>` : ''}
              </cite>
            </blockquote>
          `;
        }).join('')}
      </div>

      <div style="margin-top: var(--space-12); text-align: center;">
        <a href="${paths.chapters()}" class="btn btn-secondary">Explore all chapters</a>
      </div>
    </div>
  `;
}
