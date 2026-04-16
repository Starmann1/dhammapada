import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataPath = path.join(rootDir, 'data', 'dhammapada.json');
const sitemapPath = path.join(rootDir, 'sitemap.xml');

const baseUrl = (process.env.SITE_BASE_URL || 'https://starmann1.github.io/dhammapada-static').replace(/\/+$/, '');
const staticPages = [
  '',
  'pages/about.html',
  'pages/faq.html',
  'pages/quotes.html',
  'pages/characters.html',
  'pages/chapter.html',
  'pages/verse.html',
  '404.html'
];

function urlElement(loc) {
  return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
}

function main() {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const urls = new Set(staticPages.map((page) => `${baseUrl}/${page}`.replace(/\/$/, '')));

  for (const chapter of data.chapters) {
    urls.add(`${baseUrl}/pages/chapter.html?id=${chapter.id}`);
    for (const verse of chapter.verses) {
      urls.add(`${baseUrl}/pages/verse.html?id=${chapter.id}-${verse.verse_number}`);
    }
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...urls].sort().map(urlElement),
    '</urlset>',
    ''
  ].join('\n');

  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`Generated sitemap at ${sitemapPath}`);
}

main();
