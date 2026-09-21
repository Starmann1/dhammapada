import { getFaqs } from '../store.js';
import { updatePageMeta } from '../render.js';

export function render() {
    updatePageMeta({ title: 'FAQ - The Dhammapada' });
    const faqs = getFaqs();

    // Will bind events after render
    setTimeout(() => {
        const triggers = document.querySelectorAll('.accordion-trigger');
        triggers.forEach(t => {
            t.addEventListener('click', () => {
                const isExpanded = t.getAttribute('aria-expanded') === 'true';
                t.setAttribute('aria-expanded', !isExpanded);
                const content = document.getElementById(t.getAttribute('aria-controls'));
                if (content) {
                    content.style.display = isExpanded ? 'none' : 'block';
                }
            });
        });
    }, 0);

    return `
        <div class="container reading-column">
            <div class="page-header" style="margin-bottom: 3rem;">
                <h1>Frequently Asked Questions</h1>
            </div>
            
            <div class="accordion" style="display: flex; flex-direction: column; gap: 1rem;">
                ${faqs.map((faq, idx) => `
                    <div class="surface" style="border-radius: 8px; overflow: hidden;">
                        <button class="accordion-trigger" aria-expanded="${idx === 0}" aria-controls="faq-content-${idx}" style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; background: transparent; border: none; cursor: pointer; color: var(--text-color); font-size: 1.1rem; font-weight: 500; text-align: left;">
                            ${faq.question}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div id="faq-content-${idx}" class="accordion-content" style="display: ${idx === 0 ? 'block' : 'none'}; padding: 0 1.5rem 1.5rem 1.5rem;">
                            <div class="accordion-content-inner text-serif" style="line-height: 1.6; color: var(--text-color-muted);">
                                ${faq.answer.replace(/\\n/g, '<br>')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}
