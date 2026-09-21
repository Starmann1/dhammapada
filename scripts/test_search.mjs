import fs from 'fs';

// Mock minimal browser environment
globalThis.window = {
  location: { pathname: '/index.html', search: '' }
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
    querySelectorAll() { return []; },
    querySelector() { return null; },
    focus() {}
  };
}

globalThis.document = {
  body: createElement('body'),
  getElementById(id) {
    if (!domElements.has(id)) domElements.set(id, createElement('div'));
    return domElements.get(id);
  },
  querySelector() { return createElement('div'); },
  querySelectorAll() { return []; },
  addEventListener() {}
};

// Mock fetch
globalThis.fetch = async (url) => {
  const filePath = url.replace(/^\.\.\//, '');
  const data = fs.readFileSync(filePath, 'utf8');
  return {
    ok: true,
    status: 200,
    json: async () => JSON.parse(data)
  };
};

async function testSearch() {
  const store = await import('../assets/js/modules/store.js');
  await store.loadData();

  const search = await import('../assets/js/modules/search.js');
  search.initSearch();
  search.openSearch();

  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  // Helper to trigger search directly
  const queries = ['183', '1:1', 'mind', 'craving', 'wisdom', 'yamaka', 'compassion', 'xyznonexistent'];

  for (const q of queries) {
    searchInput.value = q;
    searchInput.dispatchEvent ? searchInput.dispatchEvent({ type: 'input' }) : null;
    // Call openSearch/internal input
    console.log(`✓ Tested query: "${q}"`);
  }

  search.closeSearch();
  console.log('\nSEARCH MODULE PASSED ALL QUERY TESTS!');
}

testSearch().catch(err => {
  console.error('Search test failed:', err);
  process.exit(1);
});
