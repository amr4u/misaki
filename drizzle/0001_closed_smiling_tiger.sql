CREATE TABLE `practice_records` (
	`id` text PRIMARY KEY NOT NULL,
	`wiki_id` text NOT NULL,
	`wiki_revision` integer NOT NULL,
	`title_snapshot` text NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`hints` text NOT NULL,
	`feedback` text NOT NULL,
	`outcome` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`wiki_id`) REFERENCES `wiki_pages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `practice_topic_time` ON `practice_records` (`wiki_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `project_context` (
	`document_key` text NOT NULL,
	`revision` integer NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`markdown` text NOT NULL,
	`status` text NOT NULL,
	`references_json` text DEFAULT '[]' NOT NULL,
	`recorded_at` text NOT NULL,
	PRIMARY KEY(`document_key`, `revision`)
);
--> statement-breakpoint
CREATE INDEX `context_kind` ON `project_context` (`kind`);--> statement-breakpoint
CREATE TABLE `raw_metadata` (
	`raw_id` text PRIMARY KEY NOT NULL,
	`processed` integer DEFAULT 0 NOT NULL,
	`processed_at` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`raw_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `write_receipts` (
	`request_id` text PRIMARY KEY NOT NULL,
	`operation` text NOT NULL,
	`signature` text NOT NULL,
	`result_json` text NOT NULL,
	`valid` integer NOT NULL,
	`created_at` text NOT NULL,
	CONSTRAINT "receipt_precondition" CHECK("write_receipts"."valid" = 1)
);
--> statement-breakpoint
CREATE TABLE `wiki_pages` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`markdown` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	`merged_into` text
);
--> statement-breakpoint
CREATE TABLE `wiki_sources` (
	`wiki_id` text NOT NULL,
	`raw_id` text NOT NULL,
	PRIMARY KEY(`wiki_id`, `raw_id`),
	FOREIGN KEY (`wiki_id`) REFERENCES `wiki_pages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`raw_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `wiki_source_raw` ON `wiki_sources` (`raw_id`);