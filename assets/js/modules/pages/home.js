import { getFeaturedVerseIds, getVerse, getVerseOfTheDay, getVerseOfTheDayDateString, getAllChapters, on } from '../store.js';
import { paths } from '../router.js';
import { stripTags, updatePageMeta } from '../render.js';

/**
 * Renders the Home page matching the Sacred Minimalism luxury aesthetic.
 * @returns {string} HTML content
 */
export function render() {
    updatePageMeta({ title: 'The Dhammapada — A Study Companion' });
    
    const votd = getVerseOfTheDay();
    const dateStr = getVerseOfTheDayDateString();
    const allChapters = getAllChapters();
    // Show first 8 chapters in preview collection list
    const previewChapters = allChapters.slice(0, 8);

    return `
        <div class="hero">
            <div class="hero-eyebrow eyebrow">
                <span class="dharma-symbol">☸</span>
                A STUDY COMPANION
            </div>
            <h1 class="hero-title">The Dhammapada</h1>
            <p class="hero-subtitle">Read the Buddha&rsquo;s verses slowly. Pali and English, stories, and a quiet place to return.</p>
            <div class="hero-actions">
                <a href="${paths.chapter(1)}" class="btn btn-pill-primary" data-link>Begin reading</a>
                <a href="${paths.chapters()}" class="btn btn-pill-secondary" data-link>Browse chapters</a>
            </div>
            <div class="hero-meta">26 chapters &middot; 423 verses &middot; English + Pali</div>
        </div>
        
        <div class="container reading-column">
            <section class="votd-section" aria-label="Verse of the Day" id="votdSection">
                <div class="eyebrow votd-label">VERSE OF THE DAY &middot; ${dateStr}</div>
                <h2 class="votd-title">A teaching for today</h2>
                <div class="votd-content" id="votdContent">
                    <p class="votd-quote">${votd ? stripTags(votd.translation) : 'Loading today\'s teaching...'}</p>
                    <div class="votd-meta">${votd ? `Dhammapada ${votd.verse_number}` : ''}</div>
                    ${votd ? `
                    <a href="${paths.verse(votd.id)}" class="btn-pill-outline" data-link>
                        Open verse ${votd.verse_number} <span class="arrow">&rarr;</span>
                    </a>` : ''}
                </div>
            </section>
        </div>

        <div class="container reading-column">
            <section class="collection-section" aria-label="The Collection">
                <div class="collection-header">
                    <div>
                        <div class="eyebrow">THE COLLECTION</div>
                        <h2 class="collection-title">Twenty-six chapters</h2>
                    </div>
                    <a href="${paths.chapters()}" class="view-all-link" data-link>View all</a>
                </div>
                <div class="chapter-list" role="list">
                    ${previewChapters.map((ch) => `
                        <a href="${paths.chapter(ch.id)}" class="chapter-list-item" data-link role="listitem">
                            <div class="chapter-list-number">${String(ch.id).padStart(2, '0')}</div>
                            <div class="chapter-list-info">
                                <div class="chapter-list-name">${ch.name_en}</div>
                                <div class="chapter-list-pali">${ch.name_pali} &middot; ${ch.verses ? ch.verses.length : 0} verses</div>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </section>
        </div>

        <div class="container reading-column">
            <section class="featured-quote-section" aria-label="Contemplative Quote">
                <blockquote class="featured-quote">
                    &ldquo;Intention shapes experiences; intention is first, they&rsquo;re made by intention. If with corrupt intent you speak or act, suffering follows you, like a wheel, the ox&rsquo;s foot.&rdquo;
                </blockquote>
                <a href="${paths.quotes()}" class="more-quotes-link" data-link>More quotations</a>
            </section>
        </div>

        <div class="container reading-column">
            <section class="study-assistant-card" aria-label="Dhamma AI Study Assistant">
                <div class="eyebrow">STUDY ASSISTANT</div>
                <h3 class="study-title">Ask a question. Answers stay with the verses.</h3>
                <p class="study-description">Dhamma AI retrieves the relevant Pali, English, commentary, and stories before it speaks.</p>
                <a href="${paths.ai()}" class="btn btn-pill-primary" data-link>Open Dhamma AI</a>
            </section>
        </div>
    `;
}

let midnightTimer = null;

function updateVotdCard() {
    const votdSection = document.getElementById('votdSection');
    if (!votdSection) return;
    const votd = getVerseOfTheDay();
    if (!votd) return;

    const label = votdSection.querySelector('.votd-label');
    if (label) {
        label.textContent = `VERSE OF THE DAY · ${getVerseOfTheDayDateString()}`;
    }
    const quote = votdSection.querySelector('.votd-quote');
    if (quote) {
        quote.textContent = stripTags(votd.translation);
    }
    const meta = votdSection.querySelector('.votd-meta');
    if (meta) {
        meta.textContent = `Dhammapada ${votd.verse_number}`;
    }
    let link = votdSection.querySelector('a.btn-pill-outline');
    if (link) {
        link.href = paths.verse(votd.id);
        link.innerHTML = `Open verse ${votd.verse_number} <span class="arrow">&rarr;</span>`;
    } else {
        const content = votdSection.querySelector('.votd-content');
        if (content) {
            const newLink = document.createElement('a');
            newLink.className = 'btn-pill-outline';
            newLink.setAttribute('data-link', '');
            newLink.href = paths.verse(votd.id);
            newLink.innerHTML = `Open verse ${votd.verse_number} <span class="arrow">&rarr;</span>`;
            content.appendChild(newLink);
        }
    }
}

/**
 * Post-render lifecycle: schedules automatic midnight refresh and data-hydration update.
 */
export function afterRender() {
    if (midnightTimer) {
        clearTimeout(midnightTimer);
        midnightTimer = null;
    }

    // Auto-update at midnight local time so the verse automatically advances if tab is left open
    function scheduleMidnightUpdate() {
        const now = new Date();
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
        const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());

        midnightTimer = setTimeout(() => {
            updateVotdCard();
            scheduleMidnightUpdate();
        }, msUntilMidnight);
    }
    scheduleMidnightUpdate();

    // Re-check and update once data is loaded (if initial render happened before store was ready)
    on('dataLoaded', () => {
        updateVotdCard();
    });
}

