import { getCharacters, getVerse } from '../store.js';
import { paths } from '../router.js';
import { updatePageMeta, stripTags } from '../render.js';

/**
 * Renders the Characters page.
 * @returns {string} HTML content
 */
export function render() {
  updatePageMeta({
    title: 'Characters — The Dhammapada',
    description: 'Prominent figures and teachers in the Dhammapada commentary tradition.'
  });

  const characters = getCharacters();

  return `
    <div class="container reading-column">
      <div class="page-header" style="margin-bottom: 2.5rem;">
        <div class="eyebrow text-accent">TRADITION &amp; LORE</div>
        <h1>Characters</h1>
        <p class="text-serif" style="margin-top: 0.75rem; font-size: 1.15rem; line-height: 1.6; color: var(--fg-muted);">
          Key figures whose encounters with the Buddha form the backdrop of the Dhammapada commentary stories.
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 2rem;">
        ${characters.map(char => {
          const linkedVerses = (char.linked_verse_ids || [])
            .map(id => getVerse(id))
            .filter(Boolean);

          return `
            <article class="surface" style="padding: 2rem; border-radius: var(--radius-md);">
              <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                <h2 style="font-size: 1.5rem; margin: 0;">${char.name}</h2>
                <span class="chip" style="font-size: 0.75rem;">${char.role}</span>
              </div>
              <p class="text-serif" style="line-height: 1.65; color: var(--fg); margin: 0.75rem 0;">
                ${char.summary}
              </p>
              ${char.significance ? `
                <p class="text-sm text-muted" style="line-height: 1.55; margin-bottom: 1.25rem;">
                  <strong>Significance:</strong> ${char.significance}
                </p>
              ` : ''}

              ${linkedVerses.length > 0 ? `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                  <div class="text-xs text-subtle" style="text-transform: uppercase; letter-spacing: var(--tracking-wider); margin-bottom: 0.5rem; font-weight: 600;">
                    Associated Verses
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${linkedVerses.map(v => `
                      <a href="${paths.verse(v.id)}" class="chip chip--active text-xs" style="text-decoration: none;" title="Dhammapada ${v.verse_number}: ${stripTags(v.translation).slice(0, 60)}...">
                        Dhp ${v.verse_number} &middot; ${v.chapter_name}
                      </a>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </article>
          `;
        }).join('')}
      </div>

      <div style="margin-top: 3.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); text-align: center;">
        <a href="${paths.about()}" class="btn btn-ghost">&larr; Return to About</a>
      </div>
    </div>
  `;
}
