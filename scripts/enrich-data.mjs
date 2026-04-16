import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.resolve(__dirname, '..', 'data', 'dhammapada.json');

const THEME_DEFINITIONS = [
  {
    id: 'mind-training',
    label: 'Mind Training',
    search_query: 'mind',
    description: 'Teachings on intention, attention, and the discipline of thought.'
  },
  {
    id: 'compassion',
    label: 'Compassion',
    search_query: 'compassion',
    description: 'Verses about non-hatred, kindness, forgiveness, and peace.'
  },
  {
    id: 'effort',
    label: 'Effort',
    search_query: 'effort',
    description: 'Teachings on diligence, vigilance, and steady practice.'
  },
  {
    id: 'wisdom',
    label: 'Wisdom',
    search_query: 'wisdom',
    description: 'Passages on clear seeing, understanding, and freedom from delusion.'
  },
  {
    id: 'ethics',
    label: 'Ethical Living',
    search_query: 'virtue',
    description: 'Guidance on speech, action, restraint, and moral conduct.'
  },
  {
    id: 'impermanence',
    label: 'Impermanence',
    search_query: 'impermanence',
    description: 'Reflections on mortality, change, and the fragile nature of life.'
  },
  {
    id: 'desire',
    label: 'Freedom from Craving',
    search_query: 'craving',
    description: 'Verses about craving, attachment, sense desire, and release.'
  },
  {
    id: 'liberation',
    label: 'Liberation',
    search_query: 'nibbana',
    description: 'Teachings pointing toward Nirvana, peace, and the deathless.'
  }
];

const THEME_RULES = [
  { id: 'mind-training', pattern: /\bmind|mental|thought|awareness|attention|memory\b/i },
  { id: 'compassion', pattern: /\bhatred|anger|love|compassion|kindness|forgiveness|peace|resentment|enmity\b/i },
  { id: 'effort', pattern: /\beffort|energy|diligent|heedful|heedfulness|practice|strive|persever|vigilance|meditation\b/i },
  { id: 'wisdom', pattern: /\bwise|wisdom|understand|knowledge|truth|delusion|ignorance|insight\b/i },
  { id: 'ethics', pattern: /\bdeed|action|speech|conduct|virtue|discipline|self-control|pure|moral|restraint\b/i },
  { id: 'impermanence', pattern: /\bdeath|die|mortal|aging|impermanent|change|birth|decay\b/i },
  { id: 'desire', pattern: /\bdesire|craving|lust|greed|attachment|sensual|pleasure|thirst\b/i },
  { id: 'liberation', pattern: /\bnibbana|nirvana|deathless|freedom|liberation|arahat|arahant|release\b/i }
];

const FEATURED_CHAPTER_IDS = new Set([1, 2, 13, 14, 20, 26]);
const FEATURED_VERSE_NUMBERS = [1, 2, 5, 21, 25, 103, 160, 183, 204, 223, 277, 278, 279, 354, 423];
const FEATURED_VERSE_SET = new Set(FEATURED_VERSE_NUMBERS);

const WORD_MEANINGS = {
  1: [
    { term: 'Manopubbaṅgamā', meaning: 'preceded by mind' },
    { term: 'Dhammā', meaning: 'mental states or phenomena' },
    { term: 'Manoseṭṭhā', meaning: 'mind is chief' },
    { term: 'Manomayā', meaning: 'mind-made' },
    { term: 'Paduṭṭhena', meaning: 'defiled or corrupted' },
    { term: 'Dukkhamanveti', meaning: 'suffering follows' }
  ],
  2: [
    { term: 'Pasannena', meaning: 'clear, serene, or faithful' },
    { term: 'Sukhamanveti', meaning: 'happiness follows' },
    { term: 'Chāyāva', meaning: 'like a shadow' },
    { term: 'Anapāyinī', meaning: 'never departing' }
  ],
  5: [
    { term: 'Verena', meaning: 'by hatred' },
    { term: 'Verāni', meaning: 'enmities or hatreds' },
    { term: 'Averena', meaning: 'by non-hatred' },
    { term: 'Sammanti', meaning: 'are calmed or appeased' },
    { term: 'Dhammo sanantano', meaning: 'the timeless law' }
  ],
  21: [
    { term: 'Appamādo', meaning: 'heedfulness or vigilance' },
    { term: 'Amatapadaṁ', meaning: 'the path to the deathless' },
    { term: 'Pamādo', meaning: 'heedlessness' },
    { term: 'Maccuno padaṁ', meaning: 'the path of death' }
  ],
  103: [
    { term: 'Sahassaṁ', meaning: 'a thousand' },
    { term: 'Jine', meaning: 'would conquer' },
    { term: 'Attānaṁ', meaning: 'oneself' },
    { term: 'Sa ve saṅgāmajuttamo', meaning: 'that one is the highest victor in battle' }
  ],
  160: [
    { term: 'Attā hi', meaning: 'self indeed' },
    { term: 'Attano nātho', meaning: 'one’s own refuge' },
    { term: 'Ko hi nātho paro siyā', meaning: 'who else could be the refuge?' },
    { term: 'Sudantena', meaning: 'well-trained' }
  ],
  183: [
    { term: 'Sabbapāpassa akaraṇaṁ', meaning: 'not doing any evil' },
    { term: 'Kusalassa upasampadā', meaning: 'cultivating what is skillful' },
    { term: 'Sacittapariyodapanaṁ', meaning: 'purifying one’s own mind' },
    { term: 'Etaṁ buddhāna sāsanaṁ', meaning: 'this is the teaching of the Buddhas' }
  ],
  204: [
    { term: 'Ārogya', meaning: 'health' },
    { term: 'Paramā lābhā', meaning: 'the highest gain' },
    { term: 'Santuṭṭhi', meaning: 'contentment' },
    { term: 'Paramaṁ dhanaṁ', meaning: 'the greatest wealth' },
    { term: 'Nibbānaṁ', meaning: 'Nirvana' }
  ],
  277: [
    { term: 'Sabbe saṅkhārā', meaning: 'all conditioned things' },
    { term: 'Aniccā', meaning: 'impermanent' },
    { term: 'Yadā paññāya passati', meaning: 'when one sees with wisdom' },
    { term: 'Nibbindati dukkhe', meaning: 'one turns away from suffering' }
  ],
  278: [
    { term: 'Sabbe saṅkhārā', meaning: 'all conditioned things' },
    { term: 'Dukkhā', meaning: 'unsatisfactory or suffering' },
    { term: 'Maggo visuddhiyā', meaning: 'the path to purification' }
  ],
  279: [
    { term: 'Sabbe dhammā', meaning: 'all phenomena' },
    { term: 'Anattā', meaning: 'not-self' },
    { term: 'Visuddhiyā', meaning: 'to purification' }
  ],
  354: [
    { term: 'Sabbadānaṁ', meaning: 'of all gifts' },
    { term: 'Dhammadānaṁ', meaning: 'the gift of the teaching' },
    { term: 'Sabbara saṁ', meaning: 'of all tastes' },
    { term: 'Dhammaraso', meaning: 'the taste of the teaching' }
  ],
  423: [
    { term: 'Pubbenivāsaṁ', meaning: 'former lives' },
    { term: 'Jātikkhayaṁ', meaning: 'the end of births' },
    { term: 'Abhiññāvosito', meaning: 'perfected in higher knowledge' },
    { term: 'Muni', meaning: 'sage' }
  ]
};

const FAQS = [
  {
    id: 'what-is-dhammapada',
    question: 'What is the Dhammapada?',
    answer: 'The Dhammapada is a classical Buddhist scripture made up of 423 verses organized into 26 chapters. It focuses on ethics, mind training, wisdom, and liberation.'
  },
  {
    id: 'how-to-read',
    question: 'How should I read this text?',
    answer: 'A practical approach is to read one chapter or a small set of verses at a time, compare the Pali and English, and then sit with the commentary and story before moving on.'
  },
  {
    id: 'why-pali-and-translation',
    question: 'Why show both Pali and English?',
    answer: 'The Pali preserves the original poetic cadence and key doctrinal terms, while the English translation makes the teaching approachable for modern readers.'
  },
  {
    id: 'what-are-stories',
    question: 'Why are there Buddhist stories with the verses?',
    answer: 'Traditional Dhammapada commentaries often preserve narrative contexts that show how a teaching was applied in lived situations, making the verse easier to remember and interpret.'
  },
  {
    id: 'are-word-meanings-complete',
    question: 'Are the word meanings complete for every verse?',
    answer: 'Not yet. The study layout supports word-by-word notes, and the current release includes curated key terms for selected verses while the full study layer is expanded.'
  },
  {
    id: 'are-audio-readings-available',
    question: 'Do all verses include audio?',
    answer: 'No. The site is prepared to display verse audio when a source is available, but the current dataset does not yet include recordings for every verse.'
  },
  {
    id: 'can-i-bookmark',
    question: 'Can I bookmark verses?',
    answer: 'Yes. Bookmarks are stored locally in your browser so you can quickly return to important verses without creating an account.'
  },
  {
    id: 'is-this-a-replacement-for-practice',
    question: 'Is this site meant to replace study with a teacher or community?',
    answer: 'No. The site is a study companion. It is best used alongside careful reading, reflection, and guidance from reliable teachers or traditional sources.'
  }
];

const ABOUT = {
  title: 'About The Dhammapada',
  intro: 'A focused reading and study companion for one of the best-known collections of the Buddha’s teachings.',
  sections: [
    {
      id: 'book',
      title: 'What This Book Is',
      body: 'The Dhammapada is a compact collection of verses that distills major Buddhist themes into short, memorable teachings. Its chapters move through mind, discipline, effort, wisdom, and liberation with unusual clarity and precision.'
    },
    {
      id: 'site-purpose',
      title: 'Why This Site Exists',
      body: 'This project is designed as an approachable study surface: chapter browsing, verse reading, commentary, narrative context, and discovery tools that help readers return to the text regularly.'
    },
    {
      id: 'study-approach',
      title: 'How To Use It',
      body: 'A good rhythm is simple: read the verse aloud, compare the translation and transliteration, review a few key terms, then use the commentary and related verses to deepen understanding.'
    },
    {
      id: 'future',
      title: 'What Comes Next',
      body: 'The long-term roadmap adds richer study notes, more audio support, a Python API backed by MongoDB, and carefully cited retrieval-based AI features built only on approved site content.'
    }
  ]
};

const CHARACTER_SEED = [
  {
    id: 'the-buddha',
    name: 'The Buddha',
    role: 'Teacher',
    summary: 'The Buddha is the central teacher behind every verse in the collection and the point of reference for the commentarial stories.',
    significance: 'He appears as the source of instruction, correction, and practical insight across the Dhammapada tradition.',
    linkedVerseNumbers: [1, 5, 21, 183]
  },
  {
    id: 'mara',
    name: 'Mara',
    role: 'Tempter',
    summary: 'Mara represents temptation, confusion, death, and the inner forces that obstruct liberation.',
    significance: 'Verses about vigilance, restraint, and stable practice often frame Mara as the opponent of a disciplined mind.',
    linkedVerseNumbers: [7, 8]
  },
  {
    id: 'cakkhupala-thera',
    name: 'Cakkhupāla Thera',
    role: 'Monk',
    summary: 'A monk whose story illustrates how intention shapes karmic consequence.',
    significance: 'His narrative is paired with the opening verse to emphasize the ethical primacy of mind.',
    linkedVerseNumbers: [1]
  },
  {
    id: 'queen-samavati',
    name: 'Queen Sāmāvatī',
    role: 'Lay disciple',
    summary: 'A devoted lay follower remembered for mindfulness, calm, and loving-kindness under threat.',
    significance: 'Her story is central to the teaching on heedfulness as the path to the deathless.',
    linkedVerseNumbers: [21, 22, 23]
  },
  {
    id: 'devadatta',
    name: 'Devadatta',
    role: 'Cautionary figure',
    summary: 'A recurring example of jealousy, ambition, and the destructive momentum of defiled intention.',
    significance: 'He appears in traditional story cycles as a warning against pride and hostility.',
    linkedVerseNumbers: [17]
  },
  {
    id: 'khujjuttara',
    name: 'Khujjuttarā',
    role: 'Lay disciple and transmitter',
    summary: 'A trusted laywoman known for listening carefully and faithfully repeating the Buddha’s teachings.',
    significance: 'She embodies listening, retention, and the careful handing on of the Dhamma.',
    linkedVerseNumbers: [22, 23]
  }
];

const QUOTE_SEED = [
  { verseNumber: 1, title: 'Mind Comes First', theme: 'Mind Training' },
  { verseNumber: 2, title: 'Happiness Follows', theme: 'Mind Training' },
  { verseNumber: 5, title: 'Hatred Ends Through Non-Hatred', theme: 'Compassion' },
  { verseNumber: 21, title: 'Heedfulness and the Deathless', theme: 'Effort' },
  { verseNumber: 103, title: 'Conquer Yourself', theme: 'Wisdom' },
  { verseNumber: 160, title: 'Be Your Own Refuge', theme: 'Effort' },
  { verseNumber: 183, title: 'The Core Teaching', theme: 'Ethical Living' },
  { verseNumber: 204, title: 'Contentment Is Wealth', theme: 'Ethical Living' },
  { verseNumber: 223, title: 'Answer Anger with Non-Anger', theme: 'Compassion' },
  { verseNumber: 277, title: 'All Conditioned Things Are Impermanent', theme: 'Impermanence' },
  { verseNumber: 278, title: 'All Conditioned Things Are Unsatisfactory', theme: 'Impermanence' },
  { verseNumber: 279, title: 'All Phenomena Are Not-Self', theme: 'Wisdom' },
  { verseNumber: 354, title: 'The Gift of Dhamma', theme: 'Liberation' },
  { verseNumber: 423, title: 'The Fulfilled Sage', theme: 'Liberation' }
];

const asciiMap = new Map([
  ['ā', 'a'],
  ['ī', 'i'],
  ['ū', 'u'],
  ['ṅ', 'n'],
  ['ñ', 'n'],
  ['ṭ', 't'],
  ['ḍ', 'd'],
  ['ṇ', 'n'],
  ['ḷ', 'l'],
  ['ṃ', 'm'],
  ['Ā', 'A'],
  ['Ī', 'I'],
  ['Ū', 'U'],
  ['Ṅ', 'N'],
  ['Ñ', 'N'],
  ['Ṭ', 'T'],
  ['Ḍ', 'D'],
  ['Ṇ', 'N'],
  ['Ḷ', 'L'],
  ['Ṃ', 'M']
]);

function transliterateToAscii(text) {
  return Array.from(text).map((char) => asciiMap.get(char) ?? char).join('');
}

function slugify(text) {
  return transliterateToAscii(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toSentence(text) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  const match = clean.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : clean).trim();
}

function truncate(text, length = 160) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= length) {
    return clean;
  }
  return `${clean.slice(0, length - 1).trim()}…`;
}

function inferThemes(verse) {
  const source = [verse.translation, verse.commentary, verse.story?.title, verse.story?.content].filter(Boolean).join(' ');
  const matches = THEME_RULES.filter((rule) => rule.pattern.test(source)).map((rule) => rule.id);
  if (matches.length > 0) {
    return matches;
  }
  return ['wisdom'];
}

function topThemeIds(themeCounts, limit = 3) {
  return [...themeCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([themeId]) => themeId);
}

function createWordMeaningLookup(verseNumber) {
  return WORD_MEANINGS[verseNumber] ? [...WORD_MEANINGS[verseNumber]] : [];
}

function getVerseOfTheDaySeedNumbers() {
  return [1, 2, 5, 21, 25, 35, 50, 103, 129, 160, 183, 204, 223, 277, 278, 279, 354, 393, 423];
}

function buildQuotes(verseMap) {
  return QUOTE_SEED.map((entry) => {
    const verse = verseMap.get(entry.verseNumber);
    if (!verse) {
      return null;
    }

    return {
      id: `quote-${verse.id}`,
      title: entry.title,
      text: verse.translation,
      verse_id: verse.id,
      verse_number: verse.verse_number,
      chapter_id: verse.chapter_id,
      chapter_name: verse.chapter_name,
      theme: entry.theme,
      excerpt: verse.share_excerpt
    };
  }).filter(Boolean);
}

function buildCharacters(verseMap) {
  return CHARACTER_SEED.map((character) => ({
    ...character,
    linked_verse_ids: character.linkedVerseNumbers
      .map((verseNumber) => verseMap.get(verseNumber)?.id)
      .filter(Boolean)
  }));
}

function buildVerseOfDaySeed(verseMap) {
  return getVerseOfTheDaySeedNumbers()
    .map((verseNumber) => verseMap.get(verseNumber)?.id)
    .filter(Boolean);
}

function main() {
  const raw = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(raw);
  const verseMap = new Map();
  const verseList = [];

  for (const chapter of data.chapters) {
    chapter.slug = slugify(chapter.name_en);
    chapter.short_summary = toSentence(chapter.summary);
    chapter.featured = FEATURED_CHAPTER_IDS.has(chapter.id);

    for (const verse of chapter.verses) {
      verse.id = `${chapter.id}-${verse.verse_number}`;
      verse.slug = `chapter-${chapter.id}-verse-${verse.verse_number}`;
      verse.chapter_id = chapter.id;
      verse.chapter_name = chapter.name_en;
      verse.transliteration = transliterateToAscii(verse.pali);
      verse.word_meanings = createWordMeaningLookup(verse.verse_number);
      verse.audio_url = null;
      verse.themes = inferThemes(verse);
      verse.is_popular = FEATURED_VERSE_SET.has(verse.verse_number);
      verse.share_excerpt = truncate(verse.translation, 180);
      verse.seo_title = `Dhammapada Verse ${verse.verse_number} | ${chapter.name_en}`;
      verse.seo_description = truncate(verse.translation, 155);

      verseMap.set(verse.verse_number, verse);
      verseList.push(verse);
    }
  }

  for (const chapter of data.chapters) {
    const themeCounts = new Map();
    for (const verse of chapter.verses) {
      for (const themeId of verse.themes) {
        themeCounts.set(themeId, (themeCounts.get(themeId) ?? 0) + 1);
      }
    }
    chapter.themes = topThemeIds(themeCounts, 3);
  }

  for (const verse of verseList) {
    const related = verseList
      .filter((candidate) => candidate.id !== verse.id)
      .map((candidate) => {
        const sharedThemes = candidate.themes.filter((themeId) => verse.themes.includes(themeId)).length;
        const score = (
          sharedThemes * 10 +
          (candidate.is_popular ? 3 : 0) -
          Math.min(Math.abs(candidate.verse_number - verse.verse_number), 50) / 50
        );
        return { id: candidate.id, score };
      })
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3)
      .map((candidate) => candidate.id);

    verse.related_verse_ids = related;
  }

  data.site = {
    title: 'The Dhammapada',
    tagline: 'Read, study, and revisit the Buddha’s teachings through chapters, verses, stories, and guided discovery.',
    description: 'A static reading and study companion for The Dhammapada with Pali text, English translation, commentary, stories, study tools, and discovery pages.',
    author: 'The Dhammapada Project',
    primary_image: 'assets/images/buddha.jpg',
    book: {
      chapter_count: data.chapters.length,
      verse_count: verseList.length,
      language_scope: ['Pali', 'English']
    }
  };
  data.about = ABOUT;
  data.faqs = FAQS;
  data.quotes = buildQuotes(verseMap);
  data.characters = buildCharacters(verseMap);
  data.theme_definitions = THEME_DEFINITIONS;
  data.featured_verse_ids = FEATURED_VERSE_NUMBERS
    .map((verseNumber) => verseMap.get(verseNumber)?.id)
    .filter(Boolean);
  data.verse_of_the_day_seed = buildVerseOfDaySeed(verseMap);
  data.generated_at = new Date().toISOString();

  fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`Enriched Dhammapada dataset at ${dataPath}`);
}

main();
