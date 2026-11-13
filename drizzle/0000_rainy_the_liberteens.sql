CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`input` text NOT NULL,
	`response` text NOT NULL,
	`request_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `records_request_id` ON `records` (`request_id`);--> statement-breakpoint
CREATE INDEX `records_time` ON `records` (`created_at`,`id`);