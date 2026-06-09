import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hearts: integer('hearts').notNull().default(5),
  xp: integer('xp').notNull().default(0),
  current_streak: integer('current_streak').notNull().default(0),
  last_played_date: text('last_played_date'),
  last_heart_lost_at: text('last_heart_lost_at'),
  ui_language: text('ui_language'),
  display_name: text('display_name'),
  current_course_id: integer('current_course_id'),
});

export const metadata = sqliteTable('metadata', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  source_language: text('source_language'),
  target_language: text('target_language'),
  total_lessons: integer('total_lessons').default(0),
});

export const lessons = sqliteTable('lessons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  course_id: integer('course_id').references(() => courses.id),
  unit_number: integer('unit_number'),
  lesson_order: integer('lesson_order'),
  title: text('title'),
  source_language: text('source_language'),
  cefr_level: text('cefr_level'),
  unit_theme: text('unit_theme'),
});

export const challenges = sqliteTable('challenges', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lesson_id: integer('lesson_id').references(() => lessons.id),
  type: text('type').notNull(),
  prompt_language: text('prompt_language'),
  prompt_text: text('prompt_text'),
  expected_answer: text('expected_answer'),
  audio_flag: integer('audio_flag', { mode: 'boolean' }).default(false),
  options: text('options'), // JSON array stored as string
});

export const userProgress = sqliteTable('user_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').references(() => users.id),
  lesson_id: integer('lesson_id').references(() => lessons.id),
  challenge_id: integer('challenge_id').references(() => challenges.id),
  is_completed: integer('is_completed', { mode: 'boolean' }).default(false),
  score: integer('score').default(0),
  mistake_count: integer('mistake_count').notNull().default(0),
});
