import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, uniqueIndex, primaryKey, check } from "drizzle-orm/sqlite-core";
export const records = sqliteTable("records", {
  id: text("id").primaryKey(),
  created_at: text("created_at").notNull(),
  input: text("input").notNull(),
  response: text("response").notNull(),
  request_id: text("request_id").notNull()
}, t => [uniqueIndex("records_request_id").on(t.request_id), index("records_time").on(t.created_at, t.id)]);

// Learning data and project rationale are independent of immutable raw records.
export const rawMetadata = sqliteTable('raw_metadata', {
  raw_id: text('raw_id').primaryKey().references(() => records.id, {
    onDelete: 'cascade'
  }),
  processed: integer('processed').notNull().default(0),
  processed_at: text('processed_at'),
  metadata: text('metadata').notNull().default('{}')
});
export const wikiPages = sqliteTable('wiki_pages', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  markdown: text('markdown').notNull(),
  tags: text('tags').notNull().default('[]'),
  revision: integer('revision').notNull().default(1),
  updated_at: text('updated_at').notNull(),
  merged_into: text('merged_into')
});
export const wikiSources = sqliteTable('wiki_sources', {
  wiki_id: text('wiki_id').notNull().references(() => wikiPages.id, {
    onDelete: 'cascade'
  }),
  raw_id: text('raw_id').notNull().references(() => records.id, {
    onDelete: 'cascade'
  })
}, t => [primaryKey({
  columns: [t.wiki_id, t.raw_id]
}), index('wiki_source_raw').on(t.raw_id)]);
export const practices = sqliteTable('practice_records', {
  id: text('id').primaryKey(),
  wiki_id: text('wiki_id').notNull().references(() => wikiPages.id),
  wiki_revision: integer('wiki_revision').notNull(),
  title_snapshot: text('title_snapshot').notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  hints: text('hints').notNull(),
  feedback: text('feedback').notNull(),
  outcome: text('outcome').notNull(),
  created_at: text('created_at').notNull()
}, t => [index('practice_topic_time').on(t.wiki_id, t.created_at)]);
export const projectContext = sqliteTable('project_context', {
  document_key: text('document_key').notNull(),
  revision: integer('revision').notNull(),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  markdown: text('markdown').notNull(),
  status: text('status').notNull(),
  references_json: text('references_json').notNull().default('[]'),
  recorded_at: text('recorded_at').notNull()
}, t => [primaryKey({
  columns: [t.document_key, t.revision]
}), index('context_kind').on(t.kind)]);
export const receipts = sqliteTable('write_receipts', {
  request_id: text('request_id').primaryKey(),
  operation: text('operation').notNull(),
  signature: text('signature').notNull(),
  result_json: text('result_json').notNull(),
  valid: integer('valid').notNull(),
  created_at: text('created_at').notNull()
}, t => [check('receipt_precondition', sql`${t.valid} = 1`)]);
