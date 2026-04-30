/* ============================================================
   Dhamma AI — Full-page chat with localStorage session memory
   ============================================================ */

const API_BASE = (() => {
    const { hostname, port } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://${hostname}:${port === '8001' ? '8001' : '8001'}`;
    }
    return ''; // Same origin on Vercel
})();

// ── Storage helpers ──────────────────────────────────────────
const STORAGE_KEY = 'dhamma_ai_sessions';

function loadSessions() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveSessions(sessions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function createSession(firstQuestion) {
    return {
        id: Date.now().toString(),
        title: firstQuestion.length > 45 ? firstQuestion.slice(0, 45) + '…' : firstQuestion,
        createdAt: Date.now(),
        messages: [],
    };
}

// ── State ────────────────────────────────────────────────────
let sessions = loadSessions();
let activeSessionId = null;

function getActiveSession() {
    return sessions.find(s => s.id === activeSessionId) || null;
}

// ── DOM refs ─────────────────────────────────────────────────
const sidebar       = document.getElementById('daiSidebar');
const sidebarClose  = document.getElementById('sidebarClose');
const menuBtn       = document.getElementById('menuBtn');
const newChatBtn    = document.getElementById('newChatBtn');
const sessionsList  = document.getElementById('sessionsList');
const sessionsEmpty = document.getElementById('sessionsEmpty');
const messagesArea  = document.getElementById('messagesArea');
const daiWelcome    = document.getElementById('daiWelcome');
const daiMessages   = document.getElementById('daiMessages');
const daiForm       = document.getElementById('daiForm');
const daiInput      = document.getElementById('daiInput');
const daiSendBtn    = document.getElementById('daiSendBtn');
const darkToggle    = document.getElementById('darkModeToggle');

// Overlay for mobile sidebar
const overlay = document.createElement('div');
overlay.className = 'dai-sidebar-overlay';
document.body.appendChild(overlay);

// ── Dark mode (sync with main site) ─────────────────────────
function applyDarkMode(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
}

function toggleDarkMode() {
    const isDark = !document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', String(isDark));
    applyDarkMode(isDark);
}

// Initialise from saved preference (default to true)
applyDarkMode(localStorage.getItem('darkMode') !== 'false');
darkToggle.addEventListener('click', toggleDarkMode);

// ── Sidebar open / close ─────────────────────────────────────
function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
}
function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
}

menuBtn.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

// ── Suggestion chips ─────────────────────────────────────────
document.querySelectorAll('.dai-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
        daiInput.value = btn.dataset.query;
        daiInput.dispatchEvent(new Event('input'));
        daiForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
});

// ── Auto-grow textarea ───────────────────────────────────────
daiInput.addEventListener('input', () => {
    daiInput.style.height = 'auto';
    daiInput.style.height = Math.min(daiInput.scrollHeight, 140) + 'px';
});

// Submit on Enter (Shift+Enter for newline)
daiInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        daiForm.requestSubmit();
    }
});

// ── Render sessions sidebar ──────────────────────────────────
function renderSessions() {
    const sorted = [...sessions].sort((a, b) => b.createdAt - a.createdAt);

    if (sorted.length === 0) {
        sessionsEmpty.style.display = 'block';
        // Remove all session items
        document.querySelectorAll('.dai-session-item').forEach(el => el.remove());
        return;
    }

    sessionsEmpty.style.display = 'none';

    // Rebuild list
    document.querySelectorAll('.dai-session-item').forEach(el => el.remove());

    sorted.forEach(session => {
        const item = document.createElement('div');
        item.className = 'dai-session-item' + (session.id === activeSessionId ? ' active' : '');
        item.dataset.id = session.id;

        const date = new Date(session.createdAt);
        const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        item.innerHTML = `
            <span class="dai-session-title" title="${escapeHtml(session.title)}">${escapeHtml(session.title)}</span>
            <span class="dai-session-date">${dateStr}</span>
            <button class="dai-session-delete" title="Delete session" aria-label="Delete session">✕</button>
        `;

        item.addEventListener('click', (e) => {
            if (e.target.closest('.dai-session-delete')) {
                deleteSession(session.id);
                return;
            }
            loadSession(session.id);
            closeSidebar();
        });

        sessionsList.appendChild(item);
    });
}

// ── Load a session into the main area ───────────────────────
function loadSession(id) {
    activeSessionId = id;
    const session = getActiveSession();
    if (!session) return;

    showMessagesArea();
    daiMessages.innerHTML = '';

    session.messages.forEach(msg => {
        if (msg.role === 'user') {
            appendUserMessage(msg.content, false);
        } else {
            appendAssistantMessage(msg.content, msg.citations || [], false);
        }
    });

    scrollToBottom();
    renderSessions();
}

// ── Start fresh session ──────────────────────────────────────
function startNewSession() {
    activeSessionId = null;
    daiMessages.innerHTML = '';
    showWelcome();
    renderSessions();
    daiInput.value = '';
    daiInput.style.height = 'auto';
}

newChatBtn.addEventListener('click', () => {
    startNewSession();
    closeSidebar();
});

// ── Delete session ───────────────────────────────────────────
function deleteSession(id) {
    sessions = sessions.filter(s => s.id !== id);
    saveSessions(sessions);
    if (activeSessionId === id) {
        startNewSession();
    } else {
        renderSessions();
    }
}

// ── Show / hide welcome vs messages ─────────────────────────
function showWelcome() {
    daiWelcome.style.display = 'flex';
    daiMessages.hidden = true;
}

function showMessagesArea() {
    daiWelcome.style.display = 'none';
    daiMessages.hidden = false;
}

// ── Append message nodes ─────────────────────────────────────
function appendUserMessage(text, save = true) {
    showMessagesArea();
    const div = document.createElement('div');
    div.className = 'dai-msg dai-msg-user';
    div.innerHTML = `
        <div class="dai-msg-avatar">☺</div>
        <div class="dai-msg-body">
            <div class="dai-msg-bubble">${escapeHtml(text)}</div>
        </div>
    `;
    daiMessages.appendChild(div);
    scrollToBottom();

    if (save) {
        getActiveSession()?.messages.push({ role: 'user', content: text });
        saveSessions(sessions);
    }

    return div;
}

function appendLoadingMessage() {
    showMessagesArea();
    const div = document.createElement('div');
    div.className = 'dai-msg dai-msg-assistant';
    div.innerHTML = `
        <div class="dai-msg-avatar">☸</div>
        <div class="dai-msg-body">
            <div class="dai-msg-bubble">
                <div class="dai-loading"><span></span><span></span><span></span></div>
            </div>
        </div>
    `;
    daiMessages.appendChild(div);
    scrollToBottom();
    return div;
}

function appendAssistantMessage(text, citations = [], save = true) {
    const citationsHtml = citations.length > 0 ? `
        <div class="dai-citations">
            ${citations.map(c => `
                <a class="dai-citation" href="../pages/${c.slug ? c.slug + '.html' : '#'}" title="${escapeHtml(c.title)}">
                    <span>${escapeHtml(c.title)}</span>
                    <small>Score ${(c.hybrid_score ?? 0).toFixed(2)}</small>
                </a>
            `).join('')}
        </div>
    ` : '';

    const div = document.createElement('div');
    div.className = 'dai-msg dai-msg-assistant';
    div.innerHTML = `
        <div class="dai-msg-avatar">☸</div>
        <div class="dai-msg-body">
            <div class="dai-msg-bubble">
                ${formatAnswer(text)}
                ${citationsHtml}
            </div>
        </div>
    `;
    daiMessages.appendChild(div);
    scrollToBottom();

    if (save) {
        getActiveSession()?.messages.push({ role: 'assistant', content: text, citations });
        saveSessions(sessions);
    }

    return div;
}

// ── Form submit ──────────────────────────────────────────────
daiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = daiInput.value.trim();
    if (!question) return;

    // Create session on first message
    if (!activeSessionId) {
        const newSession = createSession(question);
        sessions.unshift(newSession);
        activeSessionId = newSession.id;
        saveSessions(sessions);
        renderSessions();
    }

    daiInput.value = '';
    daiInput.style.height = 'auto';
    daiSendBtn.disabled = true;

    appendUserMessage(question);
    const loadingEl = appendLoadingMessage();

    try {
        const response = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, limit: 5 }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        loadingEl.remove();
        appendAssistantMessage(data.answer || 'No answer returned.', data.citations || []);

        // Update session title from first question if it matches default
        const session = getActiveSession();
        if (session && session.messages.length <= 2) {
            session.title = question.length > 45 ? question.slice(0, 45) + '…' : question;
            saveSessions(sessions);
            renderSessions();
        }
    } catch (err) {
        console.error('Chat error:', err);
        loadingEl.remove();
        appendAssistantMessage('The backend returned an error. Please ensure the server is running and try again.', []);
    }

    daiSendBtn.disabled = false;
});

// ── Utilities ────────────────────────────────────────────────
function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatAnswer(text) {
    // Split on double newlines into paragraphs
    return text
        .split(/\n{2,}/)
        .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
        .join('');
}

// ── Init ─────────────────────────────────────────────────────
renderSessions();
showWelcome();
