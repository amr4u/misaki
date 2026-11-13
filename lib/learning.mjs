import { ValidationError } from './store.mjs';
const fail = message => {
  throw new ValidationError(message);
};
const text = (v, name, max = 24000) => typeof v === 'string' && v.trim() && v.length <= max ? v : fail(`${name}: nonempty string required (max ${max})`);
const integer = (v, name, min = 0, max = 100000) => Number.isSafeInteger(v) && v >= min && v <= max ? v : fail(`${name}: integer ${min}–${max} required`);
const object = (v, name) => v && typeof v === 'object' && !Array.isArray(v) ? v : fail(`${name}: object required`);
const array = (v, name, max = 100) => Array.isArray(v) && v.length <= max ? v : fail(`${name}: array of at most ${max} required`);
const strings = (v, name, max = 100) => array(v, name, max).map(x => text(x, name, 200));
const canonical = v => JSON.stringify(v, (_k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x);
const parsePage = p => p ? {
  ...p,
  tags: JSON.parse(p.tags)
} : null;
export class LearningStore {
  constructor(db) {
    this.db = db;
  }
  stmt(sql, args = []) {
    return this.db.prepare(sql).bind(...args);
  }
  async rows(sql, args = []) {
    return (await this.stmt(sql, args).all()).results;
  }
  async first(sql, args = []) {
    return this.stmt(sql, args).first();
  }
  paging(a) {
    return [integer(a.limit ?? 20, 'limit', 1, 100), integer(a.offset ?? 0, 'offset')];
  }
  async page(sql, count, args, a, transform = x => x) {
    const [limit, offset] = this.paging(a);
    const [rows, counted] = await this.db.batch([this.stmt(`${sql} LIMIT ? OFFSET ?`, [...args, limit, offset]), this.stmt(count, args)]);
    const total = counted.results[0].n;
    return {
      items: rows.results.map(transform),
      total,
      limit,
      offset,
      next_offset: offset + rows.results.length < total ? offset + rows.results.length : null
    };
  }
  // D1 batch is transactional. A CHECK failure aborts all mutations, including
  // the receipt. Revision/source assertions run inside the same transaction.
  async write(operation, a, result, condition, conditionArgs, mutations) {
    text(a.request_id, 'request_id', 128);
    if (a.request_id.length < 8) fail('request_id must contain at least 8 characters');
    const signature = canonical(a);
    const replay = async () => {
      const old = await this.first('SELECT * FROM write_receipts WHERE request_id=?', [a.request_id]);
      if (!old) return null;
      if (old.operation !== operation || old.signature !== signature) fail('request_id reused with different content');
      return {
        ...JSON.parse(old.result_json),
        replayed: true
      };
    };
    const old = await replay();
    if (old) return old;
    const receipt = this.stmt(`INSERT INTO write_receipts (request_id,operation,signature,result_json,valid,created_at) VALUES (?,?,?,?,CASE WHEN (${condition}) THEN 1 ELSE 0 END,?)`, [a.request_id, operation, signature, JSON.stringify(result), ...conditionArgs, new Date().toISOString()]);
    try {
      await this.db.batch([receipt, ...mutations]);
    } catch (e) {
      const concurrent = await replay();
      if (concurrent) return concurrent;
      if (/receipt_precondition|UNIQUE|FOREIGN KEY|CHECK constraint/i.test(String(e))) fail('Write conflict or missing source: reread current data before retrying.');
      throw e;
    }
    return {
      ...result,
      replayed: false
    };
  }
  async queryRecords(a = {}) {
    const where = [],
      args = [];
    if (a.processed !== undefined) {
      if (typeof a.processed !== 'boolean') fail('processed must be boolean');
      where.push('COALESCE(m.processed,0)=?');
      args.push(Number(a.processed));
    }
    if (a.query !== undefined) {
      text(a.query, 'query', 300);
      where.push('(instr(lower(r.input),lower(?))>0 OR instr(lower(r.response),lower(?))>0)');
      args.push(a.query, a.query);
    }
    const from = `FROM records r LEFT JOIN raw_metadata m ON m.raw_id=r.id ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
    return this.page(`SELECT r.*,COALESCE(m.processed,0) AS processed,m.processed_at,COALESCE(m.metadata,'{}') AS metadata,(SELECT json_group_array(wiki_id) FROM wiki_sources WHERE raw_id=r.id) AS wiki_ids ${from} ORDER BY r.created_at DESC,r.id DESC`, `SELECT COUNT(*) n ${from}`, args, a, r => ({
      ...r,
      processed: !!r.processed,
      metadata: JSON.parse(r.metadata),
      wiki_ids: JSON.parse(r.wiki_ids)
    }));
  }
  async wikiSearch(a = {}) {
    const where = ['merged_into IS NULL'],
      args = [];
    if (a.query !== undefined) {
      text(a.query, 'query', 300);
      where.push('(instr(lower(title),lower(?))>0 OR instr(lower(markdown),lower(?))>0)');
      args.push(a.query, a.query);
    }
    if (a.tag !== undefined) {
      text(a.tag, 'tag', 200);
      where.push('EXISTS (SELECT 1 FROM json_each(wiki_pages.tags) WHERE value=?)');
      args.push(a.tag);
    }
    const from = 'FROM wiki_pages WHERE ' + where.join(' AND ');
    return this.page(`SELECT id,title,tags,revision,updated_at ${from} ORDER BY updated_at DESC,id DESC`, `SELECT COUNT(*) n ${from}`, args, a, parsePage);
  }
  async wikiGet(id) {
    text(id, 'id', 128);
    const page = parsePage(await this.first('SELECT * FROM wiki_pages WHERE id=?', [id]));
    if (!page) return {
      page: null
    };
    const sources = await this.rows('SELECT r.id,r.created_at FROM records r JOIN wiki_sources s ON s.raw_id=r.id WHERE s.wiki_id=? ORDER BY r.created_at,r.id', [id]);
    return {
      page,
      sources,
      redirect_to: page.merged_into ?? null
    };
  }
  async wikiCommit(a) {
    const pages = array(a.pages ?? [], 'pages', 10),
      evaluations = array(a.evaluations ?? [], 'evaluations', 100);
    if (!pages.length && !evaluations.length) fail('pages or evaluations required');
    const now = new Date().toISOString(),
      conditions = [],
      params = [],
      mutations = [],
      ids = new Set(),
      raws = new Set();
    for (const p of pages) {
      object(p, 'page');
      text(p.id, 'page.id', 128);
      if (ids.has(p.id)) fail('duplicate page ID');
      ids.add(p.id);
      integer(p.expected_revision, 'expected_revision');
      text(p.title, 'title', 300);
      text(p.markdown, 'markdown', 40000);
      strings(p.tags ?? [], 'tags', 30);
      strings(p.source_raw_ids ?? [], 'source_raw_ids');
      array(p.merge_from ?? [], 'merge_from', 10);
    }
    const mergeIds = new Set();
    for (const p of pages) {
      conditions.push('(COALESCE((SELECT revision FROM wiki_pages WHERE id=?),0)=? AND NOT EXISTS (SELECT 1 FROM wiki_pages WHERE id=? AND merged_into IS NOT NULL))');
      params.push(p.id, p.expected_revision, p.id);
      const revision = p.expected_revision + 1;
      mutations.push(this.stmt('INSERT INTO wiki_pages (id,title,markdown,tags,revision,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,markdown=excluded.markdown,tags=excluded.tags,revision=excluded.revision,updated_at=excluded.updated_at', [p.id, p.title, p.markdown, JSON.stringify(p.tags ?? []), revision, now]));
      for (const raw of p.source_raw_ids ?? []) {
        raws.add(raw);
        mutations.push(this.stmt('INSERT OR IGNORE INTO wiki_sources (wiki_id,raw_id) VALUES (?,?)', [p.id, raw]));
      }
      for (const merge of p.merge_from ?? []) {
        object(merge, 'merge');
        text(merge.id, 'merge.id', 128);
        integer(merge.expected_revision, 'merge.expected_revision', 1);
        if (ids.has(merge.id) || mergeIds.has(merge.id)) fail('merge source must be distinct and cannot also be edited');
        mergeIds.add(merge.id);
        conditions.push('EXISTS (SELECT 1 FROM wiki_pages WHERE id=? AND revision=? AND merged_into IS NULL)');
        params.push(merge.id, merge.expected_revision);
        mutations.push(this.stmt('INSERT OR IGNORE INTO wiki_sources (wiki_id,raw_id) SELECT ?,raw_id FROM wiki_sources WHERE wiki_id=?', [p.id, merge.id]));
        mutations.push(this.stmt('UPDATE wiki_pages SET merged_into=?,revision=revision+1,updated_at=? WHERE id=?', [p.id, now, merge.id]));
      }
    }
    const evalIds = new Set();
    for (const e of evaluations) {
      object(e, 'evaluation');
      text(e.raw_id, 'raw_id', 128);
      if (evalIds.has(e.raw_id)) fail('duplicate evaluation');
      evalIds.add(e.raw_id);
      raws.add(e.raw_id);
      text(e.note, 'note', 4000);
      const meta = object(e.metadata ?? {}, 'metadata');
      if (JSON.stringify(meta).length > 8000) fail('metadata too large');
      const patch = JSON.stringify({
        ...meta,
        processing_note: e.note
      });
      mutations.push(this.stmt("INSERT INTO raw_metadata (raw_id,processed,processed_at,metadata) VALUES (?,1,?,?) ON CONFLICT(raw_id) DO UPDATE SET processed=1,processed_at=COALESCE(raw_metadata.processed_at,excluded.processed_at),metadata=json_patch(raw_metadata.metadata,excluded.metadata)", [e.raw_id, now, patch]));
    }
    for (const raw of raws) {
      conditions.push('EXISTS (SELECT 1 FROM records WHERE id=?)');
      params.push(raw);
    }
    const result = {
      ok: true,
      pages: pages.map(p => ({
        id: p.id,
        revision: p.expected_revision + 1
      })),
      processed_raw_ids: [...evalIds],
      committed_at: now
    };
    return this.write('wiki_commit', a, result, conditions.join(' AND ') || '1', params, mutations);
  }
  async savePractice(a) {
    text(a.wiki_id, 'wiki_id', 128);
    integer(a.wiki_revision, 'wiki_revision', 1);
    text(a.question, 'question', 8000);
    text(a.answer, 'answer', 12000);
    text(a.feedback, 'feedback', 16000);
    const hints = strings(a.hints ?? [], 'hints', 20);
    if (!['independent', 'with_hint', 'needs_practice'].includes(a.outcome)) fail('invalid outcome');
    if (a.outcome === 'independent' && hints.length) fail('independent outcome cannot include hints');
    if (a.outcome === 'with_hint' && !hints.length) fail('with_hint requires actual hints');
    const id = crypto.randomUUID(),
      now = new Date().toISOString();
    const row = this.stmt('INSERT INTO practice_records (id,wiki_id,wiki_revision,title_snapshot,question,answer,hints,feedback,outcome,created_at) SELECT ?,id,revision,title,?,?,?,?,?,? FROM wiki_pages WHERE id=?', [id, a.question, a.answer, JSON.stringify(hints), a.feedback, a.outcome, now, a.wiki_id]);
    return this.write('save_practice', a, {
      ok: true,
      id,
      created_at: now
    }, 'EXISTS (SELECT 1 FROM wiki_pages WHERE id=? AND revision=? AND merged_into IS NULL)', [a.wiki_id, a.wiki_revision], [row]);
  }
  async listPractices(a = {}) {
    let prefix = '',
      where = '',
      args = [];
    if (a.wiki_id !== undefined) {
      text(a.wiki_id, 'wiki_id', 128);
      prefix = 'WITH RECURSIVE topics(id) AS (SELECT ? UNION SELECT p.id FROM wiki_pages p JOIN topics t ON p.merged_into=t.id) ';
      where = ' WHERE wiki_id IN (SELECT id FROM topics)';
      args = [a.wiki_id];
    }
    return this.page(`${prefix}SELECT * FROM practice_records${where} ORDER BY created_at DESC,id DESC`, `${prefix}SELECT COUNT(*) n FROM practice_records${where}`, args, a, r => ({
      ...r,
      hints: JSON.parse(r.hints)
    }));
  }
  async contextQuery(a = {}) {
    if (a.history !== undefined && typeof a.history !== 'boolean') fail('history must be boolean');
    const where = [],
      args = [];
    if (!a.history) where.push('c.revision=(SELECT MAX(revision) FROM project_context WHERE document_key=c.document_key)');
    for (const k of ['document_key', 'kind']) if (a[k] !== undefined) {
      text(a[k], k, 128);
      where.push(`c.${k}=?`);
      args.push(a[k]);
    }
    if (a.revision !== undefined) {
      if (!a.document_key) fail('document_key required with revision');
      integer(a.revision, 'revision', 1);
      where.push('c.revision=?');
      args.push(a.revision);
    }
    if (a.revision !== undefined && a.history !== true) fail('history=true required with revision');
    if (a.query !== undefined) {
      text(a.query, 'query', 300);
      where.push('(instr(lower(c.title),lower(?))>0 OR instr(lower(c.markdown),lower(?))>0)');
      args.push(a.query, a.query);
    }
    const from = `FROM project_context c ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
    return this.page(`SELECT c.* ${from} ORDER BY c.recorded_at DESC,c.document_key,c.revision DESC`, `SELECT COUNT(*) n ${from}`, args, a, r => {
      const {
        references_json,
        ...rest
      } = r;
      return {
        ...rest,
        references: JSON.parse(references_json)
      };
    });
  }
  async contextCommit(a) {
    text(a.document_key, 'document_key', 128);
    text(a.title, 'title', 300);
    text(a.markdown, 'markdown', 40000);
    integer(a.expected_revision, 'expected_revision');
    if (!['requirements', 'reference', 'decision', 'plan'].includes(a.kind)) fail('invalid context kind');
    if (!['proposed', 'accepted', 'superseded', 'recorded'].includes(a.status)) fail('invalid context status');
    const refs = array(a.references ?? [], 'references', 30);
    for (const r of refs) {
      object(r, 'reference');
      text(r.label, 'reference.label', 300);
      if (r.url !== undefined) {
        text(r.url, 'reference.url', 2000);
        if (!/^https?:\/\//.test(r.url)) fail('reference URL must use HTTP(S)');
      }
      if (r.document_key !== undefined) text(r.document_key, 'reference.document_key', 128);
      if (!r.url && !r.document_key) fail('reference requires url or document_key');
    }
    const revision = a.expected_revision + 1,
      now = new Date().toISOString();
    return this.write('context_commit', a, {
      ok: true,
      document_key: a.document_key,
      revision,
      recorded_at: now
    }, 'COALESCE((SELECT MAX(revision) FROM project_context WHERE document_key=?),0)=? AND NOT EXISTS (SELECT 1 FROM project_context WHERE document_key=? AND kind<>?)', [a.document_key, a.expected_revision, a.document_key, a.kind], [this.stmt('INSERT INTO project_context (document_key,revision,kind,title,markdown,status,references_json,recorded_at) VALUES (?,?,?,?,?,?,?,?)', [a.document_key, revision, a.kind, a.title, a.markdown, a.status, JSON.stringify(refs), now])]);
  }
}
