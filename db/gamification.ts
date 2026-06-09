/**
 * Bright Lingo — Gamification Logic
 *
 * Uses the shared asset DB handle (via getDb()) for heart regen + streak safety.
 * User state is kept in a separate 'user_state' table created on first boot.
 */
import { getDb, isDbReady } from './assetDb';
import { useStore } from '../store/useStore';

const USER_STATE_CREATE = `
  CREATE TABLE IF NOT EXISTS user_state (
    id               INTEGER PRIMARY KEY DEFAULT 1,
    hearts           INTEGER NOT NULL DEFAULT 5,
    xp               INTEGER NOT NULL DEFAULT 0,
    current_streak   INTEGER NOT NULL DEFAULT 0,
    last_played_date TEXT,
    last_heart_lost_at TEXT,
    display_name     TEXT,
    ui_language      TEXT
  )
`;
const USER_STATE_INSERT = `INSERT OR IGNORE INTO user_state (id) VALUES (1)`;

export async function onAppOpen() {
  console.log('[onAppOpen] Starting gamification logic…');
  if (!isDbReady()) {
    console.log('[onAppOpen] DB not ready (web?). Skipping.');
    return;
  }

  try {
    const db = getDb();

    // Ensure user_state table exists (non-destructive, split into two calls)
    await db.execAsync(USER_STATE_CREATE);
    await db.runAsync(USER_STATE_INSERT);

    const userRow = await db.getFirstAsync<{
      hearts: number;
      xp: number;
      current_streak: number;
      last_played_date: string | null;
      last_heart_lost_at: string | null;
      display_name: string | null;
      ui_language: string | null;
    }>('SELECT * FROM user_state WHERE id = 1');

    if (!userRow) {
      console.error('[onAppOpen] No user_state row found even after INSERT OR IGNORE.');
      return;
    }

    const now = new Date();
    let newHearts = userRow.hearts;
    let newStreak = userRow.current_streak;
    let newLastPlayed = userRow.last_played_date;
    let newLastHeartLostAt = userRow.last_heart_lost_at;

    // ── Heart Regeneration ──────────────────────────────────────────────────
    if (newHearts < 5 && newLastHeartLostAt) {
      const lastLost = new Date(newLastHeartLostAt);
      const diffMs = now.getTime() - lastLost.getTime();
      const REGEN_TIME_MS = 14_400_000; // 4 hours per heart

      const heartsToRecover = Math.floor(diffMs / REGEN_TIME_MS);
      if (heartsToRecover > 0) {
        newHearts = Math.min(5, newHearts + heartsToRecover);
        newLastHeartLostAt = newHearts < 5
          ? new Date(now.getTime() - (diffMs % REGEN_TIME_MS)).toISOString()
          : null;
      }
    }

    // ── Clock-Drift-Safe Streak ─────────────────────────────────────────────
    if (newLastPlayed) {
      const lastPlayed = new Date(newLastPlayed);
      const getDateStr = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const lastDateStr = getDateStr(lastPlayed);
      const nowDateStr  = getDateStr(now);

      if (now.getTime() < lastPlayed.getTime()) {
        // Clock drifted backwards — freeze streak
        console.log('[onAppOpen] Clock drift detected. Freezing streak.');
      } else if (nowDateStr !== lastDateStr) {
        const utcLast = Date.UTC(lastPlayed.getFullYear(), lastPlayed.getMonth(), lastPlayed.getDate());
        const utcNow  = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const daysDiff = Math.floor((utcNow - utcLast) / 86_400_000);

        if (daysDiff === 1) {
          newStreak += 1;
          console.log(`[onAppOpen] Next day! Streak → ${newStreak}`);
        } else if (daysDiff > 1) {
          newStreak = 0;
          console.log('[onAppOpen] Streak broken. Reset to 0.');
        }
        newLastPlayed = now.toISOString();
      }
    } else {
      newLastPlayed = now.toISOString();
    }

    // ── Persist to DB ────────────────────────────────────────────────────────
    await db.runAsync(
      `UPDATE user_state SET hearts = ?, current_streak = ?, last_played_date = ?, last_heart_lost_at = ? WHERE id = 1`,
      [newHearts, newStreak, newLastPlayed, newLastHeartLostAt]
    );

    // ── Hydrate Zustand ──────────────────────────────────────────────────────
    useStore.getState().setGamificationState({ hearts: newHearts, xp: userRow.xp, currentStreak: newStreak });

    if (userRow.display_name) useStore.getState().setDisplayName(userRow.display_name);
    if (userRow.ui_language) {
      useStore.getState().setLanguage(userRow.ui_language === 'te' ? 'Telugu' : 'Hindi');
      useStore.getState().setSkillLevel('Beginner');
    }

    console.log('[onAppOpen] Complete. Hearts:', newHearts, '| Streak:', newStreak, '| XP:', userRow.xp);
  } catch (e) {
    console.error('[onAppOpen] Error:', e);
  }
}

/**
 * Called by the Zustand store to persist a challenge result to the DB.
 */
export async function persistChallengeResult(
  isCorrect: boolean,
  currentHearts: number,
  currentXp: number,
  currentStreak: number
) {
  if (!isDbReady()) return; // no-op on web
  try {
    const db = getDb();
    if (isCorrect) {
      await db.runAsync(
        'UPDATE user_state SET xp = ?, current_streak = ? WHERE id = 1',
        [currentXp + 10, currentStreak + 1]
      );
    } else {
      await db.runAsync(
        'UPDATE user_state SET hearts = ?, last_heart_lost_at = ? WHERE id = 1',
        [Math.max(0, currentHearts - 1), new Date().toISOString()]
      );
    }
  } catch (e) {
    console.error('[persistChallengeResult] Error:', e);
    throw e; // Re-throw so Zustand rollback triggers
  }
}

/**
 * Persist user display_name and ui_language after onboarding.
 */
export async function persistUserProfile(displayName: string, uiLanguage: string) {
  if (!isDbReady()) return; // no-op on web
  try {
    const db = getDb();
    await db.runAsync(
      'UPDATE user_state SET display_name = ?, ui_language = ? WHERE id = 1',
      [displayName, uiLanguage]
    );
    console.log('[persistUserProfile] Saved:', displayName, uiLanguage);
  } catch (e) {
    console.error('[persistUserProfile] Error:', e);
  }
}
