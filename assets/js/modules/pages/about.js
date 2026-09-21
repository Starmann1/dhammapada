/**
 * @module pages/about
 * About page — Purpose, origin, translation lineage, and tradition
 */
import { getAbout } from '../store.js';
import { paths } from '../router.js';
import { updatePageMeta } from '../render.js';

/**
 * Renders the About page.
 * @returns {string} HTML content
 */
export function render() {
  const about = getAbout() || {
    title: 'About The Dhammapada',
    intro: 'A calm, contemplative study companion for returning to the Buddha’s teachings.',
    sections: []
  };

  updatePageMeta({
    title: 'About — The Dhammapada',
    description: 'Learn about the purpose, scholarly lineage, and design philosophy of this Dhammapada study companion.'
  });

  return `
    <div class="container reading-column" style="padding-top: var(--space-6); padding-bottom: var(--space-16);">
      <div class="page-header" style="margin-bottom: var(--space-10);">
        <div class="eyebrow text-accent">ORIGINS &amp; PURPOSE</div>
        <h1>${about.title}</h1>
        <p class="text-serif text-muted" style="font-size: var(--font-size-lg); line-height: var(--leading-relaxed); margin-top: var(--space-3); color: var(--fg);">
          ${about.intro}
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: var(--space-10);">
        ${(about.sections || []).map(section => {
          const text = section.body || section.content || '';
          return `
            <section aria-labelledby="section-${section.id}">
              <h2 class="section-heading" id="section-${section.id}" style="margin-bottom: var(--space-3); font-size: var(--font-size-xl); color: var(--fg);">
                ${section.title}
              </h2>
              <div class="text-serif" style="line-height: var(--leading-relaxed); color: var(--fg-muted); font-size: var(--font-size-base);">
                ${text.replace(/\r?\n\r?\n/g, '</p><p style="margin-top: var(--space-3);">').replace(/\r?\n/g, '<br>')}
              </div>
            </section>
          `;
        }).join('')}
      </div>

      <div style="margin-top: var(--space-12); padding-top: var(--space-6); border-top: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: center;">
        <a href="${paths.characters()}" class="btn btn-secondary">Traditional Characters &rarr;</a>
        <a href="${paths.credits()}" class="btn btn-ghost">Credits &amp; Attribution</a>
        <a href="${paths.faq()}" class="btn btn-ghost">Frequently Asked Questions</a>
      </div>
    </div>
  `;
}
