ALTER TABLE `challenges` ADD `prompt_language` text;--> statement-breakpoint
ALTER TABLE `challenges` ADD `prompt_text` text;--> statement-breakpoint
ALTER TABLE `challenges` ADD `expected_answer` text;--> statement-breakpoint
ALTER TABLE `challenges` ADD `audio_flag` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `challenges` ADD `options` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `source_language` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `target_language` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `total_lessons` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `lessons` ADD `unit_number` integer;--> statement-breakpoint
ALTER TABLE `lessons` ADD `lesson_order` integer;--> statement-breakpoint
ALTER TABLE `lessons` ADD `title` text;--> statement-breakpoint
ALTER TABLE `user_progress` ADD `lesson_id` integer REFERENCES lessons(id);--> statement-breakpoint
ALTER TABLE `user_progress` ADD `is_completed` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_progress` ADD `score` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `current_course_id` integer;