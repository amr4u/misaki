import { test } from 'node:test';
import assert from 'node:assert/strict';
import { D1 } from './d1.mjs';
import { Store } from '../lib/store.mjs';
import { LearningStore } from '../lib/learning.mjs';
import { handleMcp } from '../lib/mcp.mjs';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const setup = () => {
  const db = new D1();
  db.migrate();
  return {
    db,
    s: new LearningStore(db),
    raw: new Store(db)
  };
};
const page = (id = 'topic-a', rev = 0, raw = []) => ({
  id,
  expected_revision: rev,
  title: '詢問日文表達',
  markdown: 'これは日本語で何と言いますか。\nこれは にほんごで なんと いいますか。',
  tags: ['日常'],
  source_raw_ids: raw
});
const context = (revision = 0) => ({
  request_id: `context-${revision}`,
  document_key: 'architecture',
  expected_revision: revision,
  kind: 'decision',
  title: '架構決策',
  markdown: `版本 ${revision + 1}：原始問答保留，教材持續整合。`,
  status: 'accepted',
  references: [{
    label: '原始需求',
    document_key: 'requirements'
  }]
});
test('ingest and later comparisons preserve raw, metadata and source links', async () => {
  const {
    db,
    s,
    raw
  } = setup();
  const first = await raw.save({
    input: '這個的日文怎麼說',
    response: 'これは日本語で何と言いますか。',
    request_id: 'raw-first'
  });
  assert.equal((await s.queryRecords({
    processed: false
  })).total, 1);
  const a = {
    request_id: 'ingest-first',
    pages: [page('topic-a', 0, [first.id])],
    evaluations: [{
      raw_id: first.id,
      note: '已整合',
      metadata: {
        tags: ['日常'],
        custom: {
          priority: 1
        }
      }
    }]
  };
  await s.wikiCommit(a);
  assert.equal((await s.wikiCommit(a)).replayed, true);
  await assert.rejects(s.wikiCommit({
    ...a,
    evaluations: [{
      raw_id: first.id,
      note: '不同內容'
    }]
  }), /different content/);
  const second = await raw.save({
    input: '口語怎麼說',
    response: '何て言うの？',
    request_id: 'raw-second'
  });
  await s.wikiCommit({
    request_id: 'ingest-second',
    pages: [{
      ...page('topic-a', 1, [second.id]),
      markdown: '禮貌與朋友語氣不同。'
    }],
    evaluations: [{
      raw_id: second.id,
      note: '補充口語版本'
    }]
  });
  await s.wikiCommit({
    request_id: 'review-old-raw',
    evaluations: [{
      raw_id: first.id,
      note: '再次比較確認',
      metadata: {
        custom: {
          second: true
        }
      }
    }]
  });
  assert.deepEqual({
    ...(await raw.get(first.id))
  }, Object.fromEntries(Object.entries(first).filter(([k]) => k !== 'inserted')));
  const p = await s.wikiGet('topic-a');
  assert.equal(p.page.revision, 2);
  assert.equal(p.sources.length, 2);
  const q = await s.queryRecords({
    processed: true,
    query: '這個'
  });
  assert.equal(q.total, 1);
  assert.deepEqual(q.items[0].metadata.custom, {
    priority: 1,
    second: true
  });
  assert.equal((await s.wikiSearch({
    tag: '日常'
  })).total, 1);
  db.db.close();
});
test('conflicts and missing sources roll back pages, metadata and receipts together', async () => {
  const {
    db,
    s,
    raw
  } = setup();
  const r = await raw.save({
    input: 'a',
    response: 'b',
    request_id: 'raw-rollback'
  });
  await s.wikiCommit({
    request_id: 'initial-page',
    pages: [page()]
  });
  await assert.rejects(s.wikiCommit({
    request_id: 'stale-update',
    pages: [page('topic-a', 0)],
    evaluations: [{
      raw_id: r.id,
      note: '不該標記'
    }]
  }), /conflict/i);
  assert.equal((await s.queryRecords({
    processed: false
  })).total, 1);
  await assert.rejects(s.wikiCommit({
    request_id: 'missing-source',
    pages: [page('never-created', 0, ['missing'])]
  }), /conflict/i);
  assert.equal((await s.wikiGet('never-created')).page, null);
  assert.equal(db.db.prepare('SELECT COUNT(*) n FROM write_receipts').get().n, 1);
  // A foreign-key failure after the assertion also rolls back the receipt.
  await assert.rejects(s.write('fault-test', {
    request_id: 'atomic-fault'
  }, {
    ok: true
  }, '1', [], [s.stmt('INSERT INTO wiki_sources (wiki_id,raw_id) VALUES (?,?)', ['topic-a', 'missing'])]), /conflict/i);
  assert.equal(db.db.prepare('SELECT COUNT(*) n FROM write_receipts').get().n, 1);
  const attempts = await Promise.allSettled([s.wikiCommit({
    request_id: 'racing-one',
    pages: [page('topic-a', 1)]
  }), s.wikiCommit({
    request_id: 'racing-two',
    pages: [page('topic-a', 1)]
  })]);
  assert.equal(attempts.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal((await s.wikiGet('topic-a')).page.revision, 2);
  db.db.close();
});
test('practice evidence survives page merge; invented hint outcome rejected', async () => {
  const {
    db,
    s
  } = setup();
  await s.wikiCommit({
    request_id: 'practice-pages',
    pages: [page('a'), page('b')]
  });
  const a = {
    request_id: 'practice-save',
    wiki_id: 'a',
    wiki_revision: 1,
    question: '請問這個用日文怎麼說？',
    answer: 'これは日本語で何と言いますか。',
    hints: [],
    feedback: '表達自然。',
    outcome: 'independent'
  };
  const saved = await s.savePractice(a);
  assert.equal((await s.savePractice(a)).id, saved.id);
  await assert.rejects(s.savePractice({
    ...a,
    request_id: 'hint-rejected',
    hints: ['提示']
  }), /hints/);
  await s.wikiCommit({
    request_id: 'merge-topics',
    pages: [{
      ...page('b', 1),
      merge_from: [{
        id: 'a',
        expected_revision: 1
      }]
    }]
  });
  assert.equal((await s.wikiSearch()).total, 1);
  assert.equal((await s.wikiGet('a')).redirect_to, 'b');
  const practice = await s.listPractices({
    wiki_id: 'b'
  });
  assert.equal(practice.total, 1);
  assert.equal(practice.items[0].wiki_id, 'a');
  assert.equal(practice.items[0].wiki_revision, 1);
  await assert.rejects(s.savePractice({
    ...a,
    request_id: 'merged-page-write'
  }), /conflict/i);
  db.db.close();
});
test('context keeps original rationale and references; stale revision and duplicate retries safe', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'misaki-context-')),
    path = join(folder, 'db.sqlite');
  let db = new D1(path);
  db.migrate();
  let s = new LearningStore(db);
  await s.contextCommit(context());
  await s.contextCommit(context(1));
  assert.equal((await s.contextCommit(context(1))).replayed, true);
  await assert.rejects(s.contextCommit({
    ...context(),
    request_id: 'stale-context'
  }), /conflict/i);
  assert.equal((await s.contextQuery()).items[0].revision, 2);
  const old = await s.contextQuery({
    document_key: 'architecture',
    revision: 1,
    history: true
  });
  assert.match(old.items[0].markdown, /版本 1/);
  assert.equal(old.items[0].references[0].document_key, 'requirements');
  db.db.close();
  db = new D1(path);
  s = new LearningStore(db);
  assert.equal((await s.contextQuery({
    history: true
  })).total, 2);
  db.db.close();
  rmSync(folder, {
    recursive: true
  });
});
test('raw explicit deletion removes source links and metadata but keeps learning pages', async () => {
  const {
    db,
    s,
    raw
  } = setup();
  const r = await raw.save({
    input: 'a',
    response: 'b',
    request_id: 'delete-source'
  });
  await s.wikiCommit({
    request_id: 'delete-ingest',
    pages: [page('topic', 0, [r.id])],
    evaluations: [{
      raw_id: r.id,
      note: '整合'
    }]
  });
  await raw.delete(r.id);
  assert.equal((await s.wikiGet('topic')).sources.length, 0);
  assert.equal(db.db.prepare('SELECT COUNT(*) n FROM raw_metadata').get().n, 0);
  db.db.close();
});
test('new tools are reachable through MCP and return validation errors as tool failures', async () => {
  const {
    db
  } = setup();
  const rpc = async (name, args = {}) => (await (await handleMcp(new Request('https://test/mcp', {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name,
        arguments: args
      }
    })
  }), db)).json()).result;
  assert.equal((await rpc('misaki_context_commit', context())).structuredContent.ok, true);
  assert.equal((await rpc('misaki_context_query')).structuredContent.total, 1);
  assert.equal((await rpc('misaki_wiki_commit', {
    request_id: 'invalid-empty'
  })).isError, true);
  assert.equal((await rpc('misaki_query_records', {
    processed: 'true'
  })).isError, true);
  db.db.close();
});
