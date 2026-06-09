#!/usr/bin/env node
/**
 * Bright Lingo - Build-Time ETL Script
 * Reads Telugu and Hindi TSV files from Tatoeba and generates a
 * pre-populated SQLite database at ./assets/brightlingo.db
 *
 * TSV columns: [native_id, native_text, english_id, english_text]
 * Groups every 8 sentence pairs into one Lesson.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// ─── Config ──────────────────────────────────────────────────────────────────
const ROWS_PER_LESSON = 8;
const MAX_OPTIONS = 6;
const DB_OUT_PATH = path.resolve(__dirname, '../assets/brightlingo.db');

// Updated: new comprehensive Telugu dataset (13 768 rows of real Unicode Telugu)
const TELUGU_TSV = path.resolve(
  __dirname,
  '../Sentence pairs in Telugu-English.tsv'
);
const HINDI_TSV = path.resolve(
  __dirname,
  '../Sentence pairs in Hindi-English - 2026-06-08.tsv'
);

// How many sentence pairs to use per language (must be multiple of ROWS_PER_LESSON)
// 800 rows = 100 lessons for Telugu, 800 rows = 100 lessons for Hindi
const TELUGU_CAP = 800;
const HINDI_CAP  = 800;


// ─── Decoy words pool ─────────────────────────────────────────────────────────
// Common English words used to pad options when the answer is short
const DECOYS = [
  'the','a','is','are','was','were','it','he','she','they','we','you','I',
  'my','his','her','their','our','your','this','that','these','those',
  'and','but','or','so','very','quite','not','no','yes','here','there',
  'go','come','eat','drink','walk','run','sit','stand','sleep','work',
  'home','school','market','water','food','name','time','day','night',
  'good','bad','big','small','new','old','happy','sad','hot','cold',
  'one','two','three','four','five','six','seven','eight','nine','ten',
  'please','sorry','hello','goodbye','thank','because','where','when','how',
  'man','woman','child','father','mother','brother','sister','friend',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseTsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');
  const rows = [];
  for (const line of lines) {
    const trimmed = line.replace(/\r/g, '').trim();
    if (!trimmed) continue;
    const parts = trimmed.split('\t');
    if (parts.length < 4) continue;
    // Strip BOM from first field
    const nativeId  = parts[0].replace(/^\uFEFF/, '').trim();
    const nativeText   = parts[1].trim();
    const englishText  = parts[3].trim();
    if (!nativeText || !englishText) continue;
    rows.push({ nativeId, nativeText, englishText });
  }
  return rows;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build an options array for a multiple-choice challenge.
 * Always includes the correct answer. Pads with unique decoy words.
 * Returns exactly MAX_OPTIONS items (or fewer if not enough decoys), shuffled.
 */
function buildOptions(expectedAnswer) {
  const words = expectedAnswer.split(/\s+/).filter(Boolean);
  // Start with the full answer as one option
  const pool = new Set([expectedAnswer]);

  // Add individual words from the answer as distractor options
  for (const w of words) {
    if (pool.size >= MAX_OPTIONS) break;
    if (w.length > 2 && !pool.has(w)) pool.add(w);
  }

  // Fill remaining slots from the decoys pool (shuffled)
  const shuffledDecoys = shuffle(DECOYS);
  for (const d of shuffledDecoys) {
    if (pool.size >= MAX_OPTIONS) break;
    if (!pool.has(d)) pool.add(d);
  }

  return shuffle([...pool]).slice(0, MAX_OPTIONS);
}

/**
 * Derive a CEFR level from word count of the English sentence.
 */
function deriveCefr(englishText) {
  const wc = englishText.split(/\s+/).length;
  if (wc <= 4)  return 'A1';
  if (wc <= 7)  return 'A2';
  if (wc <= 11) return 'B1';
  return 'B2';
}

/**
 * Derive a unit theme from sentence content (very lightweight keyword scan).
 */
const THEME_KEYWORDS = {
  greetings:  ['hello','hi','goodbye','bye','welcome','namaste','greet'],
  family:     ['father','mother','brother','sister','son','daughter','family','parent','child','wife','husband'],
  food:       ['eat','food','drink','meal','rice','water','hungry','cook','restaurant','taste'],
  travel:     ['go','come','walk','run','car','bus','train','road','travel','trip','arrive','leave'],
  numbers:    ['one','two','three','four','five','six','seven','eight','nine','ten','number','count','hundred'],
  time:       ['today','tomorrow','yesterday','morning','evening','night','year','month','week','day','hour'],
  school:     ['school','study','book','read','write','class','teacher','student','learn','lesson'],
  work:       ['work','job','office','money','pay','business','company'],
};

function deriveTheme(englishText) {
  const lower = englishText.toLowerCase();
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return theme;
  }
  return 'general';
}

// ─── Unit theme titles ─────────────────────────────────────────────────────────
// 20 units × 5 lessons each = 100 lessons per language
const UNIT_THEMES = [
  'General Conversation',
  'Everyday Objects',
  'People & Relationships',
  'Travel & Directions',
  'Food & Drink',
  'Time & Daily Routine',
  'Work & Office',
  'Shopping & Money',
  'Health & Body',
  'Nature & Weather',
  'House & Home',
  'School & Learning',
  'Entertainment',
  'Sports & Hobbies',
  'Technology',
  'Numbers & Quantities',
  'Emotions & Feelings',
  'City & Transport',
  'Events & Celebrations',
  'Advanced Topics',
];

// ─── Main ─────────────────────────────────────────────────────────────────────
function buildDatabase() {
  console.log('🔵 Bright Lingo ETL Pipeline starting…');
  console.log(`   Telugu TSV : ${TELUGU_TSV}`);
  console.log(`   Hindi TSV  : ${HINDI_TSV}`);
  console.log(`   Output DB  : ${DB_OUT_PATH}`);

  // Parse TSVs
  console.log('\n📖 Parsing TSV files…');
  const teluguRows = parseTsv(TELUGU_TSV);
  const hindiRows  = parseTsv(HINDI_TSV);
  console.log(`   Telugu rows : ${teluguRows.length}`);
  console.log(`   Hindi rows  : ${hindiRows.length}`);

  const teluguCapped = teluguRows.slice(0, TELUGU_CAP);
  const hindiCapped  = hindiRows.slice(0, HINDI_CAP);

  // Remove old DB if exists
  if (fs.existsSync(DB_OUT_PATH)) {
    fs.unlinkSync(DB_OUT_PATH);
    console.log('\n🗑  Removed old database.');
  }

  const db = new Database(DB_OUT_PATH);
  db.pragma('foreign_keys = ON');

  // ── Create tables ──
  console.log('\n🏗  Creating tables…');
  db.exec(`
    CREATE TABLE IF NOT EXISTS Metadata (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Courses (
      id              TEXT PRIMARY KEY,
      source_language TEXT NOT NULL,
      target_language TEXT NOT NULL DEFAULT 'en',
      total_lessons   INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS Lessons (
      id              TEXT PRIMARY KEY,
      course_id       TEXT NOT NULL REFERENCES Courses(id),
      unit_number     INTEGER NOT NULL,
      lesson_order    INTEGER NOT NULL,
      title           TEXT NOT NULL,
      source_language TEXT NOT NULL,
      cefr_level      TEXT NOT NULL,
      unit_theme      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Challenges (
      id              TEXT PRIMARY KEY,
      lesson_id       TEXT NOT NULL REFERENCES Lessons(id),
      type            TEXT NOT NULL,
      prompt_language TEXT NOT NULL,
      prompt_text     TEXT NOT NULL,
      expected_answer TEXT NOT NULL,
      audio_flag      INTEGER NOT NULL DEFAULT 0,
      options         TEXT NOT NULL
    );
  `);

  // ── Insert helper statements ──
  const insertCourse    = db.prepare(`INSERT INTO Courses (id, source_language, target_language, total_lessons) VALUES (?, ?, 'en', ?)`);
  const insertLesson    = db.prepare(`INSERT INTO Lessons (id, course_id, unit_number, lesson_order, title, source_language, cefr_level, unit_theme) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertChallenge = db.prepare(`INSERT INTO Challenges (id, lesson_id, type, prompt_language, prompt_text, expected_answer, audio_flag, options) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertMeta      = db.prepare(`INSERT OR REPLACE INTO Metadata (key, value) VALUES (?, ?)`);

  // ── Process each language ──
  const LANGUAGES = [
    { lang: 'te', label: 'Telugu', rows: teluguCapped },
    { lang: 'hi', label: 'Hindi',  rows: hindiCapped  },
  ];

  const insertAll = db.transaction(() => {
    for (const { lang, label, rows } of LANGUAGES) {
      const courseId = `course_${lang}`;
      const totalLessons = Math.ceil(rows.length / ROWS_PER_LESSON);

      console.log(`\n🌐 Processing ${label} — ${rows.length} rows → ${totalLessons} lessons`);

      insertCourse.run(courseId, lang, totalLessons);

      let lessonCounter = 0;
      let challengeCounter = 0;

      for (let i = 0; i < rows.length; i += ROWS_PER_LESSON) {
        const chunk = rows.slice(i, i + ROWS_PER_LESSON);
        lessonCounter++;

        const unitNumber  = Math.ceil(lessonCounter / 5);
        const lessonOrder = ((lessonCounter - 1) % 5) + 1;

        // Pick CEFR and theme from the most representative sentence in chunk
        const mid = chunk[Math.floor(chunk.length / 2)];
        const cefr  = deriveCefr(mid.englishText);
        const theme = deriveTheme(mid.englishText);

        const lessonId = `lesson_${lang}_${lessonCounter}`;
        const unitTheme = UNIT_THEMES[(unitNumber - 1) % UNIT_THEMES.length];
        const title    = `${unitTheme} — Part ${lessonOrder}`;

        insertLesson.run(lessonId, courseId, unitNumber, lessonOrder, title, lang, cefr, theme);

        for (let j = 0; j < chunk.length; j++) {
          const { nativeText, englishText } = chunk[j];
          challengeCounter++;

          const challengeId = `ch_${lang}_${challengeCounter}`;
          const options     = buildOptions(englishText);

          // Alternate between translate and listen types for variety
          const type = j % 3 === 2 ? 'listen' : 'translate_to_target';

          insertChallenge.run(
            challengeId,
            lessonId,
            type,
            lang,
            nativeText,
            englishText,
            j % 4 === 0 ? 1 : 0, // audio_flag: every 4th challenge has audio
            JSON.stringify(options),
          );
        }

        if (lessonCounter % 10 === 0) {
          process.stdout.write(`   Lessons inserted: ${lessonCounter}/${totalLessons}\r`);
        }
      }

      console.log(`   ✅ ${label}: ${lessonCounter} lessons, ${challengeCounter} challenges`);
    }

    // ── Metadata ──
    insertMeta.run('content_version', '3');
    insertMeta.run('build_timestamp', new Date().toISOString());
    insertMeta.run('etl_source', 'Tatoeba CC-BY 2.0');
  });

  insertAll();

  // ── Stats ──
  const lessonCount    = db.prepare('SELECT COUNT(*) as c FROM Lessons').get().c;
  const challengeCount = db.prepare('SELECT COUNT(*) as c FROM Challenges').get().c;
  const courseRows     = db.prepare('SELECT * FROM Courses').all();

  console.log('\n📊 Database Summary:');
  console.log(`   Courses    : ${courseRows.length}`);
  for (const c of courseRows) {
    console.log(`     • ${c.id} (${c.source_language}) — ${c.total_lessons} lessons`);
  }
  console.log(`   Lessons    : ${lessonCount}`);
  console.log(`   Challenges : ${challengeCount}`);
  console.log(`   DB size    : ${(fs.statSync(DB_OUT_PATH).size / 1024).toFixed(1)} KB`);

  db.close();
  console.log(`\n✅ Done! Database written to:\n   ${DB_OUT_PATH}\n`);
}

buildDatabase();
