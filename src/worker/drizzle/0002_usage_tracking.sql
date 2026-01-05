-- Usage tracking table for tracking requests and tokens per user per billing period
CREATE TABLE IF NOT EXISTS `usage` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `period_start` integer NOT NULL,
  `period_end` integer NOT NULL,
  `fast_model_requests` integer NOT NULL DEFAULT 0,
  `premium_model_requests` integer NOT NULL DEFAULT 0,
  `input_tokens` integer NOT NULL DEFAULT 0,
  `output_tokens` integer NOT NULL DEFAULT 0,
  `created_at` integer DEFAULT (unixepoch()),
  `updated_at` integer DEFAULT (unixepoch())
);

-- Index for efficient lookups by user and period
CREATE INDEX IF NOT EXISTS `idx_usage_user_period` ON `usage`(`user_id`, `period_start`, `period_end`);

