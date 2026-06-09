/**
 * Bright Lingo — Asset DB Boot Sequence
 *
 * Native (Android/iOS):
 *   Copies the bundled brightlingo.db from assets → device SQLite dir on first boot.
 *   Re-copies when CURRENT_DB_VERSION is bumped.
 *
 * Web:
 *   expo-file-system cannot copy binary assets on web.
 *   We open SQLite directly (OPFS) and return null if the DB is empty.
 *   The UI handles the empty-DB case gracefully.
 */

import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

// Only required on native — dynamic require avoids web bundler issues
const DB_NAME            = 'brightlingo.db';
const CURRENT_DB_VERSION = '3';
const DB_VERSION_KEY     = 'brightlingo_db_version';

let _db: SQLite.SQLiteDatabase | null = null;
let _webMode = false; // true if running on web (no asset copy)

// ─── Public handle ─────────────────────────────────────────────────────────────
export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    throw new Error(
      _webMode
        ? '[BrightLingo] SQLite content not available on web. Please use the Expo Go app.'
        : '[BrightLingo] DB not initialised — call initAssetDb() first'
    );
  }
  return _db;
}

export function isDbReady(): boolean {
  return _db !== null;
}

// ─── Native boot path ──────────────────────────────────────────────────────────
async function initNative(): Promise<SQLite.SQLiteDatabase> {
  // Dynamic imports so web bundler never tries to parse them
  const FileSystem = require('expo-file-system/legacy') as typeof import('expo-file-system/legacy');
  const { Asset }  = require('expo-asset')             as typeof import('expo-asset');

  const SQLITE_DIR    = FileSystem.documentDirectory + 'SQLite/';
  const DB_LOCAL_PATH = SQLITE_DIR + DB_NAME;

  // 1. Ensure SQLite directory exists
  const dirInfo = await FileSystem.getInfoAsync(SQLITE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(SQLITE_DIR, { intermediates: true });
    console.log('[initAssetDb] Created SQLite directory.');
  }

  // 2. Version-check: copy if first install or version changed
  const shouldCopy = await (async () => {
    const dbInfo = await FileSystem.getInfoAsync(DB_LOCAL_PATH);
    if (!dbInfo.exists) return true;
    const stored = await FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + DB_VERSION_KEY
    ).catch(() => '');
    return stored.trim() !== CURRENT_DB_VERSION;
  })();

  if (shouldCopy) {
    console.log('[initAssetDb] Copying DB from bundle (v' + CURRENT_DB_VERSION + ')…');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const [asset] = await Asset.loadAsync(require('../assets/brightlingo.db'));
    if (!asset.localUri) throw new Error('[initAssetDb] Asset has no localUri after loading.');
    await FileSystem.copyAsync({ from: asset.localUri, to: DB_LOCAL_PATH });
    await FileSystem.writeAsStringAsync(
      FileSystem.documentDirectory + DB_VERSION_KEY,
      CURRENT_DB_VERSION
    );
    const info = await FileSystem.getInfoAsync(DB_LOCAL_PATH);
    console.log('[initAssetDb] Copied. Size:', (info as any).size, 'bytes');
  } else {
    console.log('[initAssetDb] DB up-to-date. Skipping copy.');
  }

  // 3. Open with explicit directory for SDK 56+ compatibility
  const db = await SQLite.openDatabaseAsync(DB_NAME, undefined, SQLITE_DIR);
  _db = db;
  console.log('[initAssetDb] Opened successfully.');

  // 4. Integrity check
  const courses = await db.getAllAsync<{
    id: string; source_language: string; target_language: string; total_lessons: number;
  }>('SELECT * FROM Courses');
  console.log(`[initAssetDb] ✅ ${courses.length} course(s) found.`);

  return db;
}

// ─── Web boot path ─────────────────────────────────────────────────────────────
async function initWeb(): Promise<SQLite.SQLiteDatabase | null> {
  _webMode = true;
  try {
    // Open a named DB (stored in browser OPFS)
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    // Check if data exists (tables might not exist on fresh web session)
    const count = await db.getFirstAsync<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name='Courses'"
    ).catch(() => null);

    if (count && count.cnt > 0) {
      const courses = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) as total FROM Courses'
      ).catch(() => null);
      if (courses && courses.total > 0) {
        _db = db;
        console.log('[initAssetDb] Web: Existing DB found with course data.');
        return db;
      }
    }

    // DB is empty on web — content requires native download
    console.log('[initAssetDb] Web: DB empty. Content requires the mobile app.');
    return null;
  } catch (e) {
    console.log('[initAssetDb] Web: SQLite unavailable:', (e as Error).message);
    return null;
  }
}

// ─── Main entry point ──────────────────────────────────────────────────────────
export async function initAssetDb(): Promise<SQLite.SQLiteDatabase | null> {
  console.log('[initAssetDb] Starting on platform:', Platform.OS);

  if (Platform.OS === 'web') {
    return initWeb();
  }
  return initNative();
}

// ─── Query helpers ─────────────────────────────────────────────────────────────
export async function getCourseForLanguage(lang: 'te' | 'hi') {
  return getDb().getFirstAsync<{
    id: string; source_language: string; target_language: string; total_lessons: number;
  }>('SELECT * FROM Courses WHERE source_language = ?', [lang]);
}

export async function getLessonsForCourse(courseId: string) {
  return getDb().getAllAsync<{
    id: string; course_id: string; unit_number: number; lesson_order: number;
    title: string; cefr_level: string; unit_theme: string;
  }>('SELECT * FROM Lessons WHERE course_id = ? ORDER BY unit_number, lesson_order', [courseId]);
}

export async function getChallengesForLesson(lessonId: string) {
  const rows = await getDb().getAllAsync<{
    id: string; lesson_id: string; type: string; prompt_language: string;
    prompt_text: string; expected_answer: string; audio_flag: number; options: string;
  }>('SELECT * FROM Challenges WHERE lesson_id = ?', [lessonId]);
  return rows.map(r => ({
    ...r,
    options: JSON.parse(r.options) as string[],
    audio_flag: r.audio_flag === 1,
  }));
}
