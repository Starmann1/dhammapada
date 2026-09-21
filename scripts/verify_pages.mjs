import fs from 'fs';

const pages = [
  'index.html',
  'pages/chapters.html',
  'pages/chapter.html',
  'pages/verse.html',
  'pages/quotes.html',
  'pages/theme.html',
  'pages/faq.html',
  'pages/about.html',
  'pages/saved.html',
  'pages/dhamma-ai.html',
  'pages/characters.html',
  'pages/credits.html'
];

let allPassed = true;

for (const p of pages) {
  if (!fs.existsSync(p)) {
    console.error('MISSING:', p);
    allPassed = false;
    continue;
  }
  const content = fs.readFileSync(p, 'utf8');
  const isPagesDir = p.startsWith('pages/');
  const expectedPrefix = isPagesDir ? '../' : '';

  // Check CSS links
  for (const css of ['tokens.css', 'base.css', 'components.css']) {
    const expected = expectedPrefix + 'assets/css/' + css;
    if (!content.includes(expected)) {
      console.error(p, 'missing CSS:', expected);
      allPassed = false;
    }
  }

  // Check JS app entry
  const expectedJs = expectedPrefix + 'assets/js/app.js';
  if (!content.includes(expectedJs)) {
    console.error(p, 'missing JS:', expectedJs);
    allPassed = false;
  }

  // Check main pageContent
  if (!content.includes('id="pageContent"')) {
    console.error(p, 'missing #pageContent');
    allPassed = false;
  }

  // Check bottom nav
  if (!content.includes('class="bottom-nav"')) {
    console.error(p, 'missing bottom-nav');
    allPassed = false;
  }

  // Check command palette
  if (!content.includes('id="searchModal"')) {
    console.error(p, 'missing searchModal');
    allPassed = false;
  }

  console.log('✓ Verified chrome:', p);
}

if (allPassed) {
  console.log('\nALL 12 PAGES PASSED CHROME & LINK VERIFICATION!');
} else {
  process.exit(1);
}
