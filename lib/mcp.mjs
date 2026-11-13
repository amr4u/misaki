import { LearningStore } from './learning.mjs';
import { Store, ValidationError } from './store.mjs';
import { toolDefs } from './tools.mjs';
const json = (body, status = 200) => Response.json(body, {
  status,
  headers: {
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  }
});
const content = (data, extra = {}) => ({
  content: [{
    type: 'text',
    text: JSON.stringify(data)
  }],
  structuredContent: data,
  ...extra
});
export async function handleMcp(request, db) {
  if (request.method !== 'POST') return json({
    error: 'Method not allowed'
  }, 405);
  let obj;
  try {
    if (Number(request.headers.get('content-length')) > 131072) return json({
      error: 'Request too large'
    }, 413);
    const reader = request.body?.getReader();
    if (!reader) throw new Error();
    const chunks = [];
    let size = 0;
    while (true) {
      const {
        value,
        done
      } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 131072) {
        await reader.cancel();
        return json({
          error: 'Request too large'
        }, 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let cursor = 0;
    for (const c of chunks) {
      bytes.set(c, cursor);
      cursor += c.length;
    }
    obj = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Invalid JSON'
      }
    }, 400);
  }
  if (!obj || Array.isArray(obj) || obj.jsonrpc !== '2.0' || typeof obj.method !== 'string' || obj.id !== undefined && obj.id !== null && typeof obj.id !== 'string' && typeof obj.id !== 'number') return json({
    jsonrpc: '2.0',
    id: null,
    error: {
      code: -32600,
      message: 'Invalid request'
    }
  }, 400);
  if (obj.id === undefined) return new Response(null, {
    status: 202
  });
  const ok = result => json({
    jsonrpc: '2.0',
    id: obj.id,
    result
  });
  if (obj.method === 'server/discover') return ok({
    supportedVersions: ['2026-07-28'],
    capabilities: {
      tools: {}
    }
  });
  if (obj.method === 'initialize') return ok({
    protocolVersion: '2026-07-28',
    capabilities: {
      tools: {}
    },
    serverInfo: {
      name: 'misaki-memory',
      version: '2.0.0'
    }
  });
  if (obj.method === 'ping') return ok({});
  if (obj.method === 'tools/list') return ok({
    tools: toolDefs
  });
  if (obj.method !== 'tools/call') return json({
    jsonrpc: '2.0',
    id: obj.id,
    error: {
      code: -32601,
      message: 'Method not found'
    }
  });
  const {
    name,
    arguments: a = {}
  } = obj.params ?? {};
  try {
    if (!a || typeof a !== 'object' || Array.isArray(a)) throw new ValidationError('arguments must be an object');
    const def = toolDefs.find(t => t.name === name);
    if (!def) throw new ValidationError('Unknown tool');
    if (Object.keys(a).some(k => !(k in def.inputSchema.properties))) throw new ValidationError('Unexpected argument');
    const store = new Store(db),
      learning = new LearningStore(db);
    let data;
    switch (name) {
      case 'misaki_query_records':
        data = await learning.queryRecords(a);
        break;
      case 'misaki_wiki_search':
        data = await learning.wikiSearch(a);
        break;
      case 'misaki_wiki_get':
        data = await learning.wikiGet(a.id);
        break;
      case 'misaki_wiki_commit':
        data = await learning.wikiCommit(a);
        break;
      case 'misaki_save_practice':
        data = await learning.savePractice(a);
        break;
      case 'misaki_list_practices':
        data = await learning.listPractices(a);
        break;
      case 'misaki_context_query':
        data = await learning.contextQuery(a);
        break;
      case 'misaki_context_commit':
        data = await learning.contextCommit(a);
        break;
      case 'misaki_save_record':
        data = {
          ok: true,
          record: await store.save(a)
        };
        break;
      case 'misaki_get_record':
        data = {
          record: await store.get(a.id)
        };
        break;
      case 'misaki_list_records':
        data = await store.list(a);
        break;
      case 'misaki_export_records':
        data = await store.list({
          limit: 100,
          ...a
        });
        break;
      case 'misaki_delete_record':
        if (a.confirm !== true) throw new ValidationError('confirm=true required after explicit deletion request');
        data = await store.delete(a.id);
        break;
    }
    return ok(content(data));
  } catch (e) {
    return ok(content({
      ok: false,
      error: e instanceof ValidationError ? e.message : 'Storage operation failed; retry with the same request_id.'
    }, {
      isError: true
    }));
  }
}
