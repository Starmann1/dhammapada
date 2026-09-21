/**
 * @module pages/verse
 * Verse detail page — The crown jewel reading surface
 */
import { getVerse, getChapter, setLastRead, getPrevVerse, getNextVerse } from '../store.js';
import { getParam, paths } from '../router.js';
import { renderBreadcrumb, renderThemeChips, renderBookmarkButton, updatePageMeta, stripTags, renderEmpty } from '../render.js';
import { toggleFocus } from '../focus.js';

let currentLang = 'Together'; // Together | English | Pali
let currentTab = 'Commentary'; // Commentary | Story | Words

export function render() {
  const verseId = getParam('id');
  const verse = getVerse(verseId);

  if (!verse) {
    return renderEmpty(
      'Verse not found',
      `<p class="text-muted" style="margin-top:1rem;">The requested verse (${escapeHtml(verseId || '')}) does not exist in the collection.</p>
       <div style="margin-top:1.5rem;"><a href="${paths.chapters()}" class="btn btn-secondary">Browse chapters</a></div>`
    );
  }

  // Track last read
  setLastRead(verse.id);

  // SEO & Head updates
  const cleanTranslation = stripTags(verse.translation || '');
  const excerpt = cleanTranslation.length > 150 ? cleanTranslation.slice(0, 150) + '...' : cleanTranslation;
  updatePageMeta({
    title: `Verse ${verse.verse_number} — ${verse.chapter_name} — The Dhammapada`,
    description: `Dhammapada Verse ${verse.verse_number}: "${excerpt}"`,
    type: 'article',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ScholarlyArticle',
      'name': `Dhammapada Verse ${verse.verse_number}`,
      'headline': `Dhammapada Verse ${verse.verse_number} (${verse.chapter_name})`,
      'inLanguage': ['pi', 'en'],
      'isPartOf': {
        '@type': 'Book',
        'name': 'The Dhammapada'
      }
    }
  });

  const prev = getPrevVerse(verse.id);
  const next = getNextVerse(verse.id);

  const showEnglish = currentLang === 'Together' || currentLang === 'English';
  const showPali = currentLang === 'Together' || currentLang === 'Pali';

  // Format Pali text with line breaks
  const paliLines = stripTags(verse.pali || '').replace(/\r?\n/g, '<br>');
  const transliterationLines = (verse.transliteration || '').replace(/\r?\n/g, '<br>');
  const englishLines = cleanTranslation.replace(/\r?\n/g, '<br>');

  const html = `
    <article class="container reading-column" id="verseArticle" data-verse-id="${verse.id}" style="padding-top: var(--space-6); padding-bottom: var(--space-16);">
      ${renderBreadcrumb([
        { label: 'Read', href: paths.home() },
        { label: 'Chapters', href: paths.chapters() },
        { label: verse.chapter_name, href: paths.chapter(verse.chapter_id) },
        { label: `Verse ${verse.verse_number}` }
      ])}

      <!-- Verse Header Bar -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: var(--space-6); margin-bottom: var(--space-8); padding-bottom: var(--space-4); border-bottom: 1px solid var(--border);">
        <div>
          <div class="eyebrow" style="margin-bottom: var(--space-1);">${escapeHtml(verse.chapter_name)}</div>
          <div class="verse-number-display">${verse.verse_number}</div>
        </div>

        <div style="display: flex; align-items: center; gap: var(--space-2);">
          ${renderBookmarkButton(verse.id)}
          <button class="btn-icon" id="focusModeBtn" title="Focus mode (F)" aria-label="Toggle focus mode">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
          </button>
        </div>
      </div>

      <!-- Language Toggle -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-8);">
        <div class="verse-lang-toggle" role="group" aria-label="Language view toggle">
          <button type="button" class="${currentLang === 'Together' ? 'active' : ''}" data-lang="Together">Together</button>
          <button type="button" class="${currentLang === 'English' ? 'active' : ''}" data-lang="English">English</button>
          <button type="button" class="${currentLang === 'Pali' ? 'active' : ''}" data-lang="Pali">Pali</button>
        </div>

        <div class="text-xs text-subtle" style="letter-spacing: var(--tracking-wide);">
          ${escapeHtml(verse.story_group?.headnote_pali || '')}
        </div>
      </div>

      <!-- Scripture Text Area -->
      <section class="verse-text-block" style="margin-bottom: var(--space-10);" aria-label="Verse text">
        ${showPali ? `
          <div class="verse-pali" style="margin-bottom: var(--space-3);" lang="pi">
            ${paliLines}
          </div>
          <div class="verse-transliteration" style="margin-bottom: var(--space-6);">
            ${transliterationLines}
          </div>
        ` : ''}

        ${showEnglish ? `
          <div class="verse-english" style="margin-top: ${showPali ? 'var(--space-6)' : '0'};">
            ${englishLines}
          </div>
        ` : ''}
      </section>

      <!-- Theme Chips -->
      ${verse.themes?.length ? `
        <div style="margin-bottom: var(--space-10);">
          <div class="text-xs text-subtle" style="text-transform:uppercase;letter-spacing:var(--tracking-wider);margin-bottom:var(--space-2);font-weight:600;">Themes</div>
          ${renderThemeChips(verse.themes)}
        </div>
      ` : ''}

      <!-- Study Sections (Tabs) -->
      <section style="margin-top: var(--space-12);" aria-label="Scholarly study notes">
        <div class="verse-section-tabs" role="tablist">
          <button type="button" role="tab" class="verse-section-tab ${currentTab === 'Commentary' ? 'active' : ''}" data-tab="Commentary" aria-selected="${currentTab === 'Commentary'}">Commentary</button>
          <button type="button" role="tab" class="verse-section-tab ${currentTab === 'Story' ? 'active' : ''}" data-tab="Story" aria-selected="${currentTab === 'Story'}">Origin Story</button>
          <button type="button" role="tab" class="verse-section-tab ${currentTab === 'Words' ? 'active' : ''}" data-tab="Words" aria-selected="${currentTab === 'Words'}">Word Analysis</button>
        </div>

        <!-- Commentary Content -->
        <div class="verse-section-content ${currentTab === 'Commentary' ? 'active' : ''}" id="tab-Commentary" role="tabpanel">
          <div class="verse-commentary text-serif" style="font-size: var(--font-size-base); line-height: var(--leading-relaxed); color: var(--fg-muted);">
            ${verse.commentary ? verse.commentary.replace(/\r?\n/g, '<br><br>') : '<em>No commentary note available for this verse.</em>'}
          </div>
        </div>

        <!-- Story Content -->
        <div class="verse-section-content ${currentTab === 'Story' ? 'active' : ''}" id="tab-Story" role="tabpanel">
          ${verse.story?.title ? `<h3 class="verse-story-title" style="margin-bottom: var(--space-4); font-size: var(--font-size-lg); color: var(--fg);">${escapeHtml(verse.story.title)}</h3>` : ''}
          <div class="verse-story-content text-serif" style="font-size: var(--font-size-base); line-height: var(--leading-relaxed); color: var(--fg-muted);">
            ${verse.story?.content ? verse.story.content.replace(/\r?\n/g, '<br><br>') : '<em>No background origin story is recorded for this verse.</em>'}
          </div>
        </div>

        <!-- Words Content -->
        <div class="verse-section-content ${currentTab === 'Words' ? 'active' : ''}" id="tab-Words" role="tabpanel">
          ${verse.word_meanings && verse.word_meanings.length > 0 ? `
            <div class="verse-words">
              ${verse.word_meanings.map(w => `
                <div class="verse-word-pair surface">
                  <div class="verse-word-term">${escapeHtml(w.term)}</div>
                  <div class="verse-word-meaning">${escapeHtml(w.meaning)}</div>
                </div>
              `).join('')}
            </div>
          ` : '<p class="text-sm text-subtle">No word-by-word gloss available for this verse.</p>'}
        </div>
      </section>

      <!-- Apply to Life (Concrete Practice Generator) -->
      <section class="apply-to-life" aria-labelledby="applyToLifeHeading">
        <h3 class="apply-to-life-title" id="applyToLifeHeading" style="font-family: var(--font-serif); font-size: var(--font-size-lg); color: var(--fg); margin-bottom: var(--space-2);">
          Apply to Life
        </h3>
        <p class="text-sm text-muted" style="margin-bottom: var(--space-4); line-height: var(--leading-normal);">
          Contemplate this verse through a tangible, gentle daily practice grounded in the Buddha's advice.
        </p>

        <div id="practiceResult" style="display:none; margin-bottom:var(--space-4); padding:var(--space-4); background:var(--bg-elevated); border-left:3px solid var(--accent); border-radius:var(--radius-xs);">
          <div class="text-xs eyebrow" style="margin-bottom:var(--space-2);">TODAY'S CONTEMPLATION</div>
          <p class="text-serif text-italic" id="practiceText" style="margin:0; font-size:var(--font-size-base); line-height:var(--leading-relaxed); color:var(--fg);"></p>
        </div>

        <button type="button" class="btn btn-secondary" id="generatePracticeBtn">
          Generate daily practice
        </button>
      </section>

      <!-- Dhamma AI Assistant Callout -->
      <div style="margin-top: var(--space-8); text-align: center; padding: var(--space-6); background: var(--bg-subtle); border-radius: var(--radius-md); border: 1px solid var(--border);">
        <p class="text-serif" style="margin-bottom: var(--space-3); color: var(--fg);">Have questions about this verse?</p>
        <a href="${paths.ai()}?q=${encodeURIComponent(`Dhammapada ${verse.verse_number}`)}" class="btn btn-primary">
          Explore Verse ${verse.verse_number} with Dhamma AI &rarr;
        </a>
      </div>

      <!-- Prev / Next Navigation -->
      <nav class="verse-nav" aria-label="Adjacent verses">
        ${prev ? `
          <a href="${paths.verse(prev.id)}" class="btn btn-ghost" style="text-align: left; text-decoration: none;" aria-label="Previous verse: Verse ${prev.verse_number}">
            <span class="text-xs text-subtle" style="display:block;">&larr; Previous</span>
            <span class="text-serif" style="color:var(--fg);font-size:var(--font-size-base);">Verse ${prev.verse_number}</span>
          </a>
        ` : '<div></div>'}

        ${next ? `
          <a href="${paths.verse(next.id)}" class="btn btn-ghost" style="text-align: right; text-decoration: none;" aria-label="Next verse: Verse ${next.verse_number}">
            <span class="text-xs text-subtle" style="display:block;">Next &rarr;</span>
            <span class="text-serif" style="color:var(--fg);font-size:var(--font-size-base);">Verse ${next.verse_number}</span>
          </a>
        ` : '<div></div>'}
      </nav>
    </article>
  `;

  return html;
}

/**
 * Post-render hook to bind interactive listeners cleanly
 */
export function afterRender() {
  const article = document.getElementById('verseArticle');
  if (!article) return;
  const verseId = article.dataset.verseId;
  const verse = getVerse(verseId);
  if (!verse) return;

  // Language toggle clicks
  const langButtons = article.querySelectorAll('.verse-lang-toggle button');
  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentLang = btn.dataset.lang;
      reRender();
    });
  });

  // Tab clicks
  const tabButtons = article.querySelectorAll('.verse-section-tabs button');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      reRender();
    });
  });

  // Focus mode button
  const focusBtn = document.getElementById('focusModeBtn');
  focusBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleFocus();
  });

  // Practice generation
  const practiceBtn = document.getElementById('generatePracticeBtn');
  practiceBtn?.addEventListener('click', () => {
    generatePractice(verse);
  });

  // Keyboard navigation
  document.removeEventListener('keydown', handleVerseKeydown);
  document.addEventListener('keydown', handleVerseKeydown);
}

function reRender() {
  const pageContent = document.getElementById('pageContent');
  if (pageContent) {
    pageContent.innerHTML = render();
    afterRender();
  }
}

function handleVerseKeydown(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const article = document.getElementById('verseArticle');
  if (!article) return;
  const verseId = article.dataset.verseId;

  if (e.key === 'ArrowLeft') {
    const prev = getPrevVerse(verseId);
    if (prev) {
      window.location.href = paths.verse(prev.id);
    }
  } else if (e.key === 'ArrowRight') {
    const next = getNextVerse(verseId);
    if (next) {
      window.location.href = paths.verse(next.id);
    }
  } else if (e.key.toLowerCase() === 'f') {
    e.preventDefault();
    toggleFocus();
  }
}

function generatePractice(verse) {
  const resBox = document.getElementById('practiceResult');
  const textEl = document.getElementById('practiceText');
  if (!resBox || !textEl) return;

  const themes = verse.themes || [];
  const primaryTheme = themes[0] || 'mind-training';

  const practiceBank = {
    'mind-training': 'Pause three times today before entering a room or beginning a new task. Observe your mind’s current state without attempting to alter it, acknowledging that all actions proceed from thought.',
    'wisdom': 'When faced with an opinion or reaction today, silently ask: "Is this based on direct clarity, or inherited assumption?" Allow silence to precede your answer.',
    'compassion': 'Silently wish safety and relief from sorrow to the first three people you encounter whose temperaments challenge your patience.',
    'effort': 'Pick one constructive action you have delayed out of reluctance. Do it within the next hour with calm diligence, expecting nothing in return.',
    'ethics': 'Hold complete truthfulness in all spoken words today. If a falsehood or exaggeration rises, choose quiet restraint instead.',
    'impermanence': 'Choose one pleasant sensation and one momentary frustration today. Notice specifically how each arises, peaks, and ceases without your holding.',
    'desire': 'When the impulse arises to purchase or consume something non-essential, wait thirty minutes. Notice what happens to the desire in that interval.',
    'liberation': 'Take five conscious breaths, releasing tension from the brow and shoulders on each exhalation, tasting the peace of non-clinging.'
  };

  const selectedPractice = practiceBank[primaryTheme] || practiceBank['mind-training'];

  textEl.textContent = selectedPractice;
  resBox.style.display = 'block';
  resBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
