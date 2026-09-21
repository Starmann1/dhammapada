import { getBookmarks, getVerse, on } from '../store.js';
import { paths } from '../router.js';
import { renderVerseCard, updatePageMeta } from '../render.js';

let cleanup = null;

function renderContent() {
    const bookmarks = getBookmarks();
    
    if (bookmarks.length === 0) {
        return `
            <div class="container reading-column state-empty" style="text-align: center; padding: 4rem 0;">
                <h2 style="margin-bottom: 1rem;">No saved verses yet.</h2>
                <p class="text-muted" style="margin-bottom: 2rem;">Browse chapters to find verses that speak to you.</p>
                <a href="${paths.chapters()}" class="btn btn-primary" data-link>Browse chapters</a>
            </div>
        `;
    }

    const verses = bookmarks.map(id => getVerse(id)).filter(Boolean);

    return `
        <div class="container">
            <div class="page-header" style="margin-bottom: 2rem;">
                <h1>Saved Verses</h1>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                ${verses.map(v => renderVerseCard(v)).join('')}
            </div>
        </div>
    `;
}

export function render() {
    updatePageMeta({ title: 'Saved Verses - The Dhammapada' });

    // Handle updates when bookmarks change
    if (cleanup) cleanup();
    const updateDOM = () => {
        const container = document.getElementById('saved-container');
        if (container) container.innerHTML = renderContent();
    };
    cleanup = on('bookmarkChange', updateDOM);

    return `<div id="saved-container">${renderContent()}</div>`;
}
