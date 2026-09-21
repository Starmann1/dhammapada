import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.resolve(__dirname, '..', 'data', 'dhammapada.json');

console.log(`Reading dataset from: ${dataPath}`);
const raw = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(raw);

let jTagsStripped = 0;
let emTagsStripped = 0;
let missingCommentariesFixed = 0;
let versesProcessed = 0;

/**
 * Clean HTML formatting tags (<j>, <em>, </em>) from string fields.
 *
 * @param {string} str - The string to clean
 * @returns {string} - Cleaned string
 */
function cleanString(str) {
  if (typeof str !== 'string') return str;

  let cleaned = str;

  // Strip <j> tags (and </j> if present)
  if (cleaned.includes('<j>')) {
    const matches = (cleaned.match(/<j>/g) || []).length;
    jTagsStripped += matches;
    cleaned = cleaned.replaceAll('<j>', '');
  }
  if (cleaned.includes('</j>')) {
    const matches = (cleaned.match(/<\/j>/g) || []).length;
    jTagsStripped += matches;
    cleaned = cleaned.replaceAll('</j>', '');
  }

  // Strip <em> and </em> tags
  if (cleaned.includes('<em>')) {
    const matches = (cleaned.match(/<em>/g) || []).length;
    emTagsStripped += matches;
    cleaned = cleaned.replaceAll('<em>', '');
  }
  if (cleaned.includes('</em>')) {
    const matches = (cleaned.match(/<\/em>/g) || []).length;
    emTagsStripped += matches;
    cleaned = cleaned.replaceAll('</em>', '');
  }

  return cleaned;
}

if (Array.isArray(data.chapters)) {
  for (const chapter of data.chapters) {
    if (Array.isArray(chapter.verses)) {
      for (const verse of chapter.verses) {
        versesProcessed++;

        // 2a & 2b: Strip <j>, <em>, </em> from translation, share_excerpt, seo_description
        for (const field of ['translation', 'share_excerpt', 'seo_description']) {
          if (verse[field]) {
            verse[field] = cleanString(verse[field]);
          }
        }

        // 2c: If commentary field is missing/undefined, set it to empty string ""
        if (verse.commentary === undefined || verse.commentary === null) {
          verse.commentary = '';
          missingCommentariesFixed++;
        }
      }
    }
  }
}

// 4. Write the result back to data/dhammapada.json with 2-space indentation
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf8');

console.log('--- Dhammapada Data Fix Summary ---');
console.log(`Verses processed: ${versesProcessed}`);
console.log(`<j> tags stripped: ${jTagsStripped}`);
console.log(`<em>/</em> tags stripped: ${emTagsStripped}`);
console.log(`Missing commentaries set to "": ${missingCommentariesFixed}`);
console.log(`Saved clean data to ${dataPath}`);
