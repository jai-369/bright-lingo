import { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

const REMOTE_URL = 'https://raw.githubusercontent.com/username/repo/main/course_data.json';
const FALLBACK_ASSET = require('../assets/course_data.json');

export async function initContent(db: ExpoSQLiteDatabase<typeof schema>) {
  console.log('[initContent] Starting boot sequence...');
  
  // 1. Read metadata
  let contentVersion = 0;
  let lastRemoteFetch = 0;
  
  try {
    const cvRow = await db.select().from(schema.metadata).where(eq(schema.metadata.key, 'content_version')).get();
    if (cvRow) contentVersion = parseInt(cvRow.value, 10);
    
    const lrfRow = await db.select().from(schema.metadata).where(eq(schema.metadata.key, 'last_remote_fetch')).get();
    if (lrfRow) lastRemoteFetch = parseInt(lrfRow.value, 10);
  } catch (e) {
    console.log('Metadata not found, starting fresh.');
  }

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  let dataToApply = null;

  // 2. Fetch remote if needed
  if (now - lastRemoteFetch > ONE_DAY_MS) {
    console.log('[initContent] Attempting to fetch remote content...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(REMOTE_URL, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const json = await response.json();
        // Defensive check
        if (json && Array.isArray(json.courses)) {
          dataToApply = json;
          console.log('[initContent] Remote fetch successful. Validated JSON.');
          await db.insert(schema.metadata).values({ key: 'last_remote_fetch', value: now.toString() })
            .onConflictDoUpdate({ target: schema.metadata.key, set: { value: now.toString() } });
        } else {
          console.warn('[initContent] Remote JSON is malformed. Missing courses array.');
        }
      } else {
         console.warn('[initContent] Remote fetch failed with status:', response.status);
      }
    } catch (error) {
      console.warn('[initContent] Remote fetch timed out or failed:', error);
    }
  }

  // 3. Fallback
  if (!dataToApply) {
    console.log('[initContent] Falling back to local asset.');
    dataToApply = FALLBACK_ASSET;
  }

  // 4. Update if content version is newer
  if (dataToApply && dataToApply.content_version > contentVersion) {
    console.log(`[initContent] Updating content from version ${contentVersion} to ${dataToApply.content_version}`);
    
    await db.transaction(async (tx) => {
      // Clear old
      await tx.delete(schema.challenges);
      await tx.delete(schema.lessons);
      await tx.delete(schema.courses);
      
      // Insert new
      for (const course of dataToApply.courses) {
        const [newCourse] = await tx.insert(schema.courses).values({ title: course.title }).returning();
        
        if (course.lessons) {
          for (const lesson of course.lessons) {
            const [newLesson] = await tx.insert(schema.lessons).values({
              course_id: newCourse.id,
              source_language: lesson.source_language,
              cefr_level: lesson.cefr_level,
              unit_theme: lesson.unit_theme,
            }).returning();
            
            if (lesson.challenges) {
              for (const challenge of lesson.challenges) {
                await tx.insert(schema.challenges).values({
                  lesson_id: newLesson.id,
                  type: challenge.type,
                  prompt_language: challenge.prompt_language,
                  prompt_text: challenge.prompt_text,
                  expected_answer: challenge.expected_answer,
                  audio_flag: challenge.audio_flag ?? false,
                  options: challenge.options ? JSON.stringify(challenge.options) : null,
                });
              }
            }
          }
        }
      }
      
      // Update metadata
      await tx.insert(schema.metadata).values({ key: 'content_version', value: dataToApply.content_version.toString() })
        .onConflictDoUpdate({ target: schema.metadata.key, set: { value: dataToApply.content_version.toString() } });
    });
    console.log('[initContent] Transaction complete. Content updated.');
  } else {
    console.log('[initContent] Local content is up to date.');
  }
}
