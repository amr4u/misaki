import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../lib/store.mjs';
import { handleMcp } from '../lib/mcp.mjs';
import { D1 } from './d1.mjs';
test('persistent records, retry keys, repeated phrases, date filtering, paging and deletion', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'misaki-'));
  const path = join(folder, 'test.sqlite');
  let db = new D1(path);
  db.migrate();
  let store = new Store(db);
  const draft = {
    input: '今天身體不舒服，需要請假。',
    response: '体調が悪いので、今日はお休みします。\nたいちょうが わるいので、きょうは おやすみします。',
    request_id: 'test-turn-001'
  };
  const first = await store.save(draft);
  assert.equal(first.inserted, true);
  const retried = await store.save(draft);
  assert.equal(retried.id, first.id);
  assert.equal(retried.inserted, false);
  await assert.rejects(store.save({
    ...draft,
    response: 'different'
  }), /different content/);
  await assert.rejects(store.save({
    ...draft,
    request_id: undefined
  }), /request_id/);
  db.db.close();
  db = new D1(path);
  store = new Store(db);
  assert.equal((await store.get(first.id)).response, draft.response);
  await store.save({
    ...draft,
    request_id: 'test-turn-002'
  });
  const page = await store.list({
    limit: 1
  });
  assert.equal(page.total, 2);
  assert.equal(page.next_offset, 1);
  assert.equal((await store.list({
    limit: 1,
    offset: 1
  })).items.length, 1);
  assert.equal((await store.list({
    since: '2999-01-01'
  })).total, 0);
  await assert.rejects(store.list({
    since: '2026-02-30'
  }), /invalid since/);
  assert.equal((await store.delete(first.id)).deleted, true);
  assert.equal(await store.get(first.id), null);
  assert.equal((await store.delete(first.id)).deleted, false);
  db.db.close();
  rmSync(folder, {
    recursive: true
  });
});
test('MCP discovery, round trip, export, validation and protocol failures', async () => {
  const db = new D1();
  db.migrate();
  const rpc = async (method, params) => {
    const r = await handleMcp(new Request('http://test/mcp', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params
      })
    }), db);
    return r.json();
  };
  assert.deepEqual((await rpc('server/discover')).result.supportedVersions, ['2026-07-28']);
  assert.equal((await rpc('tools/list')).result.tools.length, 13);
  const saved = await rpc('tools/call', {
    name: 'misaki_save_record',
    arguments: {
      input: '測試',
      response: 'テスト',
      request_id: 'rpc-test-01'
    }
  });
  assert.equal(saved.result.structuredContent.ok, true);
  const id = saved.result.structuredContent.record.id;
  const exported = await rpc('tools/call', {
    name: 'misaki_export_records'
  });
  assert.equal(exported.result.structuredContent.total, 1);
  const blocked = await rpc('tools/call', {
    name: 'misaki_delete_record',
    arguments: {
      id,
      confirm: false
    }
  });
  assert.equal(blocked.result.isError, true);
  const read = await rpc('tools/call', {
    name: 'misaki_get_record',
    arguments: {
      id
    }
  });
  assert.equal(read.result.structuredContent.record.input, '測試');
  const invalid = await rpc('tools/call', {
    name: 'misaki_list_records',
    arguments: {
      limit: 101
    }
  });
  assert.equal(invalid.result.isError, true);
  assert.equal((await rpc('unknown')).error.code, -32601);
  const broken = await handleMcp(new Request('http://test/mcp', {
    method: 'POST',
    body: '{'
  }), db);
  assert.equal(broken.status, 400);
  const huge = await handleMcp(new Request('http://test/mcp', {
    method: 'POST',
    body: ' '.repeat(131073)
  }), db);
  assert.equal(huge.status, 413);
  const notice = await handleMcp(new Request('http://test/mcp', {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    })
  }), db);
  assert.equal(notice.status, 202);
  db.db.close();
});
