import fs from 'fs';

// Mock minimal browser environment
globalThis.window = {
  location: {
    pathname: '/index.html',
    search: '?id=1'
  }
};

const domElements = new Map();

function createElement(tag) {
  return {
    tagName: tag.toUpperCase(),
    textContent: '',
    innerHTML: '',
    style: {},
    dataset: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; }
    },
    setAttribute() {},
    getAttribute() { return null; },
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    appendChild() {},
    scrollIntoView() {}
  };
}

globalThis.document = {
  body: createElement('body'),
  title: '',
  createElement,
  getElementById(id) {
    if (!domElements.has(id)) {
      domElements.set(id, createElement('div'));
    }
    return domElements.get(id);
  },
  querySelector() { return createElement('div'); },
  querySelectorAll() { return []; },
  addEventListener() {},
  removeEventListener() {}
};

globalThis.localStorage = {
  _store: {},
  getItem(key) { return this._store[key] || null; },
  setItem(key, val) { this._store[key] = String(val); },
  removeItem(key) { delete this._store[key]; }
};

// Mock fetch to return local JSON
globalThis.fetch = async (url) => {
  const filePath = url.replace(/^\.\.\//, '');
  const data = fs.readFileSync(filePath, 'utf8');
  return {
    ok: true,
    status: 200,
    json: async () => JSON.parse(data)
  };
};

async function testAll() {
  console.log('Testing Store and Data Loading...');
  const store = await import('../assets/js/modules/store.js');
  await store.loadData();
  console.log('✓ Store loaded: chapters count =', store.getAllChapters().length);

  const modules = [
    { name: 'home', file: '../assets/js/modules/pages/home.js' },
    { name: 'chapters', file: '../assets/js/modules/pages/chapters.js' },
    { name: 'chapter', file: '../assets/js/modules/pages/chapter.js', setup: () => { window.location.search = '?id=1'; } },
    { name: 'verse', file: '../assets/js/modules/pages/verse.js', setup: () => { window.location.search = '?id=1-1'; } },
    { name: 'quotes', file: '../assets/js/modules/pages/quotes.js' },
    { name: 'themes (index)', file: '../assets/js/modules/pages/themes.js', setup: () => { window.location.search = ''; } },
    { name: 'theme (detail)', file: '../assets/js/modules/pages/themes.js', setup: () => { window.location.search = '?id=mind-training'; } },
    { name: 'faq', file: '../assets/js/modules/pages/faq.js' },
    { name: 'about', file: '../assets/js/modules/pages/about.js' },
    { name: 'saved (empty)', file: '../assets/js/modules/pages/saved.js' },
    { name: 'saved (with verse)', file: '../assets/js/modules/pages/saved.js', setup: () => { store.toggleBookmark('1-1'); } },
    { name: 'ai', file: '../assets/js/modules/pages/ai.js' },
    { name: 'characters', file: '../assets/js/modules/pages/characters.js' }
  ];

  for (const m of modules) {
    if (m.setup) m.setup();
    const mod = await import(m.file);
    const html = mod.render();
    if (typeof html !== 'string' || html.length < 50) {
      console.error(`✗ Failed ${m.name}: Output length too short (${html?.length})`);
      process.exit(1);
    }
    if (mod.afterRender) {
      mod.afterRender();
    }
    console.log(`✓ Rendered ${m.name}: ${html.length} bytes`);
  }

  console.log('\nALL 13 PAGE SCENARIOS RENDERED SUCCESSFULLY WITHOUT ERRORS!');
}

testAll().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
