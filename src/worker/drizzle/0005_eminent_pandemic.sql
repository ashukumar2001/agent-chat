PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chats` (
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`model` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	`name` text,
	PRIMARY KEY(`id`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_chats`("id", "user_id", "model", "created_at", "updated_at", "name") SELECT "id", "user_id", "model", "created_at", "updated_at", "name" FROM `chats`;--> statement-breakpoint
DROP TABLE `chats`;--> statement-breakpoint
ALTER TABLE `__new_chats` RENAME TO `chats`;--> statement-breakpoint
PRAGMA foreign_keys=ON;