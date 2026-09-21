/**
 * @module pages/ai
 * Dhamma AI Study Assistant — Contemplative study grounded in scripture
 */
import { getAllChapters, getVerse } from '../store.js';
import { getParam, paths } from '../router.js';
import { updatePageMeta, stripTags, escapeHtml } from '../render.js';

let messages = [];
let isGenerating = false;

function loadMessages() {
  try {
    const stored = localStorage.getItem('dhp-ai-messages');
    if (stored) messages = JSON.parse(stored);
  } catch (e) {
    messages = [];
  }
}

function saveMessages() {
  try {
    localStorage.setItem('dhp-ai-messages', JSON.stringify(messages));
  } catch (e) {}
}

/** Format response text into paragraphs, bold markers, and citations */
function formatResponseText(text) {
  if (!text) return '';
  let formatted = escapeHtml(text);

  // Bold text: **text**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert line breaks
  formatted = formatted.replace(/\r?\n\r?\n/g, '</p><p style="margin-top:var(--space-3);margin-bottom:var(--space-3);">');
  formatted = formatted.replace(/\r?\n/g, '<br>');

  // Citations: [Dhp N:M], [Dhp N], Dhp N:M, Dhammapada N:M, Dhammapada N
  formatted = formatted.replace(/\[?(?:Dhp|Dhammapada)\s+(\d+)(?:[:.-](\d+))?\]?/gi, (match, chNum, vNum) => {
    let targetVerseId = null;
    if (vNum !== undefined) {
      targetVerseId = `${chNum}-${vNum}`;
    } else {
      // Find verse by absolute verse number
      const targetNum = Number(chNum);
      const allChapters = getAllChapters();
      for (const ch of allChapters) {
        const found = (ch.verses || []).find(v => v.verse_number === targetNum);
        if (found) {
          targetVerseId = found.id;
          break;
        }
      }
    }

    if (targetVerseId) {
      const cleanLabel = match.replace(/[\[\]]/g, '');
      return `<a href="${paths.verse(targetVerseId)}" class="ai-citation" title="Open verse in reader">${cleanLabel}</a>`;
    }
    return match;
  });

  return `<p style="margin:0;line-height:var(--leading-relaxed);">${formatted}</p>`;
}

function renderMessageList() {
  if (messages.length === 0) {
    return `
      <div style="text-align: center; padding: var(--space-8) 0;">
        <p class="text-serif text-muted" style="font-size: var(--font-size-base); margin-bottom: var(--space-6);">
          Choose a theme below or ask any question about the teachings.
        </p>
        <div class="ai-suggestions">
          ${[
            'Finding peace in a chaotic world',
            'The wise and the fool',
            'The nature of the mind',
            'Desire and suffering'
          ].map(s => `
            <button type="button" class="chip surface surface--interactive ai-suggestion" data-prompt="${escapeHtml(s)}">
              ${escapeHtml(s)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  return messages.map((m, idx) => {
    if (m.role === 'user') {
      return `
        <div class="ai-message ai-message--user">
          <div class="ai-message-content surface">
            ${escapeHtml(m.content)}
          </div>
        </div>
      `;
    }

    // Assistant message
    return `
      <div class="ai-message ai-message--assistant" style="margin-bottom: var(--space-8);">
        <div class="ai-message-content text-serif" style="font-size: var(--font-size-base);">
          ${formatResponseText(m.content)}
          
          ${m.citations && m.citations.length > 0 ? `
            <div style="margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center;">
              <span class="text-xs text-subtle" style="font-family:var(--font-sans);text-transform:uppercase;letter-spacing:var(--tracking-wider);font-weight:600;">Referenced:</span>
              ${m.citations.map(c => `
                <a href="${paths.verse(c.verse_id || c.id)}" class="ai-citation" style="font-family:var(--font-sans);" title="${escapeHtml(c.translation || '')}">
                  Dhp ${c.verse_number || c.reference}
                </a>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

export function render() {
  updatePageMeta({
    title: 'Dhamma AI — Study Assistant — The Dhammapada',
    description: 'Ask questions about the Buddha’s teachings, grounded directly in the Dhammapada scriptures.'
  });

  loadMessages();

  return `
    <div class="container reading-column" style="display: flex; flex-direction: column; min-height: calc(100vh - 12rem); padding-top: var(--space-6); padding-bottom: var(--space-12);">
      
      <!-- AI Study Header -->
      <header class="ai-header">
        <img src="${paths.image('dharmachakra.png')}" alt="" width="32" height="32">
        <h1 style="font-size: var(--font-size-2xl); margin-bottom: var(--space-1);">Dhamma AI</h1>
        <div class="text-serif text-italic text-muted" style="font-size: var(--font-size-base);">Scriptural Study Assistant</div>
        <p class="ai-grounding-note" style="margin-top: var(--space-3);">
          Every answer is strictly grounded in canonical verses and commentaries. Direct verse references are cited throughout.
        </p>

        ${messages.length > 0 ? `
          <div style="margin-top: var(--space-4);">
            <button type="button" class="btn btn-ghost text-xs" id="clearSessionBtn" style="font-size: var(--font-size-xs);">
              Clear conversation
            </button>
          </div>
        ` : ''}
      </header>

      <!-- Messages Thread -->
      <section class="ai-messages" id="aiMessagesContainer" style="flex: 1; padding: var(--space-4) 0;" aria-label="Study conversation">
        ${renderMessageList()}
      </section>

      <!-- Input Area -->
      <div class="ai-input-wrapper">
        <form id="aiChatForm" class="ai-chat-form">
          <textarea id="aiInput" class="ai-textarea" placeholder="Ask about a teaching, theme, or verse (e.g. 1:1, wisdom, grief)..." rows="1" maxlength="1000" required></textarea>
          
          <button type="submit" class="ai-submit-btn" id="aiSubmitBtn" title="Send (Enter)" aria-label="Send query">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
          </button>
        </form>
        <div class="ai-disclaimer">
          Grounded in Dhammapada citations. Not a substitute for a living teacher.
        </div>
      </div>
    </div>
  `;
}

export function afterRender() {
  const form = document.getElementById('aiChatForm');
  const input = document.getElementById('aiInput');
  const container = document.getElementById('aiMessagesContainer');
  const clearBtn = document.getElementById('clearSessionBtn');

  // Wire clear session
  clearBtn?.addEventListener('click', () => {
    messages = [];
    saveMessages();
    reRender();
  });

  // Suggestion chips
  document.querySelectorAll('.ai-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.dataset.prompt;
      if (prompt) submitQuestion(prompt);
    });
  });

  // Auto-expand textarea & Enter submission
  if (input) {
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 130) + 'px';
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form?.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
  }

  // Form submission
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input?.value.trim();
    if (query) submitQuestion(query);
  });

  // Check URL query parameter (e.g., from verse link ?q=Dhammapada%20183)
  const initialQuery = getParam('q');
  if (initialQuery && messages.length === 0) {
    submitQuestion(initialQuery);
  }
}

function reRender() {
  const pageContent = document.getElementById('pageContent');
  if (pageContent) {
    pageContent.innerHTML = render();
    afterRender();
  }
}

async function submitQuestion(question) {
  if (isGenerating || !question) return;
  isGenerating = true;

  const input = document.getElementById('aiInput');
  const submitBtn = document.getElementById('aiSubmitBtn');
  const container = document.getElementById('aiMessagesContainer');

  if (input) {
    input.value = '';
    input.style.height = 'auto';
    input.disabled = true;
  }
  if (submitBtn) submitBtn.disabled = true;

  messages.push({ role: 'user', content: question });
  saveMessages();

  // Show user message and pulsating thinking indicator
  if (container) {
    container.innerHTML = renderMessageList() + `
      <div class="ai-message ai-message--assistant" id="aiTypingIndicator">
        <div class="ai-message-content text-serif text-muted" style="display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); padding: var(--space-2) 0;">
          <div class="spinner" style="width: 14px; height: 14px; border-width: 1.5px;"></div>
          <span>Consulting canonical verses...</span>
        </div>
      </div>
    `;
    container.scrollTop = container.scrollHeight;
  }

  try {
    const result = await fetchAnswer(question);
    messages.push({
      role: 'assistant',
      content: result.answer,
      citations: result.citations || []
    });
    saveMessages();
  } catch (err) {
    console.warn('AI API failed, falling back to scriptural retrieval:', err);
    const fallbackResult = localScripturalAnswer(question);
    messages.push({
      role: 'assistant',
      content: fallbackResult.answer,
      citations: fallbackResult.citations
    });
    saveMessages();
  } finally {
    isGenerating = false;
    reRender();
  }
}

/** Call backend /api/chat with automatic resolution of base URL */
async function fetchAnswer(question) {
  const origin = window.location.origin;
  const candidates = [
    `${origin}/api`,
    'http://127.0.0.1:8001/api',
    'http://localhost:8001/api',
    'http://127.0.0.1:8000/api',
    'http://localhost:8000/api'
  ];

  let lastError = null;

  for (const base of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${base}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question, limit: 5 }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          answer: data.answer,
          citations: (data.citations || []).map(c => ({
            verse_id: `${c.chapter_id || 1}-${c.verse_number || 1}`,
            verse_number: c.verse_number,
            chapter_title: c.chapter_title,
            translation: c.translation
          }))
        };
      }
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error('Backend chat endpoint unreachable');
}

/** Grounded local search and answer composition from local corpus */
function localScripturalAnswer(question) {
  const trimmed = question.trim();

  // Check conversational pleasantries
  const gratitudeRegex = /^(thanks?(\s+(bro|man|dude|friend|mate|you|u|a\s+lot|so\s+much|very\s+much))?|thank\s+you(\s+(so\s+much|very\s+much|bro|man|friend))?|thx|ty|much\s+appreciated|appreciate\s+it|many\s+thanks)[!.,\s]*$/i;
  if (gratitudeRegex.test(trimmed)) {
    return {
      answer: "You are most welcome. In the teachings of the Buddha, gratitude (*kataññutā*) is regarded as a rare and noble virtue that brings joy, humility, and peace to the heart. May your reflections bring you clarity and gentle strength on your path. Sādhu, sādhu, sādhu.\n\nWhenever you wish to revisit or contemplate another verse, I am here to study with you.",
      citations: []
    };
  }

  const greetingRegex = /^(hi|hello|hey|greetings|namaste|good\s+(morning|afternoon|evening|day))(\s+(there|bro|friend|man|mate))?[!.,\s]*$/i;
  if (greetingRegex.test(trimmed)) {
    return {
      answer: "Namaste and welcome. I am your Dhamma AI study assistant, grounded in the canonical verses, commentaries, and background stories of the Dhammapada.\n\nWhat aspect of life, the mind, or the Buddha's teachings would you like to reflect on today?",
      citations: []
    };
  }

  const farewellRegex = /^(bye|goodbye|see\s+ya|see\s+you|take\s+care|farewell|sadhu(\s+sadhu\s+sadhu)?|peace)[!.,\s]*$/i;
  if (farewellRegex.test(trimmed)) {
    return {
      answer: "May you be well, peaceful, and free from suffering. May mindfulness guard your thoughts, speech, and actions wherever you go. Sādhu, sādhu, sādhu.",
      citations: []
    };
  }

  // Strip pleasantry prefix if followed by a real question (e.g. "thanks bro, what is verse 1?")
  const prefixRegex = /^(thanks?((\s+(bro|man|dude|friend|mate|you|u))?|((\s+(so\s+much|a\s+lot))?))|thank\s+you(\s+(so\s+much|very\s+much|bro|man|friend))?|hi|hello|hey|namaste)[!.,\s]+/i;
  const effectiveQuery = trimmed.replace(prefixRegex, '').trim() || trimmed;
  const qLower = effectiveQuery.toLowerCase();
  const allChapters = getAllChapters();
  const scored = [];

  // Match direct verse references (e.g. 1:1, 183)
  const isReference = /^(\d+)[:.-](\d+)$/.exec(effectiveQuery);
  const isExactNum = /^\d+$/.exec(effectiveQuery);

  let refCh = isReference ? Number(isReference[1]) : null;
  let refV = isReference ? Number(isReference[2]) : null;
  let exactNum = isExactNum ? Number(isExactNum[0]) : null;


  for (const ch of allChapters) {
    for (const v of ch.verses || []) {
      let score = 0;
      if (refCh && refV && ch.id === refCh && v.verse_number === refV) score += 5000;
      if (exactNum && v.verse_number === exactNum) score += 5000;

      const t = (v.translation || '').toLowerCase();
      const c = (v.commentary || '').toLowerCase();
      const themes = (v.themes || []).join(' ').toLowerCase();

      if (t.includes(qLower)) score += 300;
      if (themes.includes(qLower)) score += 200;
      if (c.includes(qLower)) score += 100;

      // Word-level matching
      const words = qLower.split(/\s+/).filter(w => w.length > 3);
      for (const w of words) {
        if (t.includes(w)) score += 30;
        if (c.includes(w)) score += 15;
        if (themes.includes(w)) score += 25;
      }

      if (score > 0) {
        scored.push({ verse: v, chapter: ch, score });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const topHits = scored.slice(0, 3);

  if (topHits.length === 0) {
    // Return general guidance with verse 1
    const defaultVerse = getVerse('1-1');
    return {
      answer: `While no specific passage in the Dhammapada matches the exact query "${question}", the core teachings consistently direct the practitioner toward the mastery of one’s own mind and the purification of intention.\n\nAs the opening teaching declares:\n> "${defaultVerse ? stripTags(defaultVerse.translation) : 'Mind precedes all mental states.'}" [Dhp 1:1]\n\nReflect on the nature of the mind and practice mindfulness in all actions.`,
      citations: defaultVerse ? [{ verse_id: defaultVerse.id, verse_number: defaultVerse.verse_number, translation: defaultVerse.translation }] : []
    };
  }

  const primary = topHits[0].verse;
  const secondary = topHits[1]?.verse;

  let answerText = `Reflecting on "${question}", the Dhammapada illuminates this through the lens of mental discipline and mindful discernment.\n\n`;
  answerText += `The Buddha teaches in **Dhammapada ${primary.verse_number}**:\n"${stripTags(primary.translation)}" [Dhp ${primary.verse_number}]\n\n`;

  if (primary.commentary) {
    answerText += `*Commentary note:* ${primary.commentary}\n\n`;
  }

  if (secondary) {
    answerText += `Furthermore, **Dhammapada ${secondary.verse_number}** adds:\n"${stripTags(secondary.translation)}" [Dhp ${secondary.verse_number}]`;
  }

  return {
    answer: answerText,
    citations: topHits.map(h => ({
      verse_id: h.verse.id,
      verse_number: h.verse.verse_number,
      translation: stripTags(h.verse.translation)
    }))
  };
}
