export class ValidationError extends Error {}
function str(v, name, max) {
  if (typeof v !== 'string' || !v.trim() || v.length > max) throw new ValidationError(`${name}: nonempty string required (max ${max})`);
  return v;
}
export class Store {
  constructor(db) {
    this.db = db;
  }
  async save({
    input,
    response,
    request_id
  }) {
    str(input, 'input', 12000);
    str(response, 'response', 24000);
    str(request_id, 'request_id', 128);
    if (request_id.length < 8) throw new ValidationError('request_id must contain at least 8 characters');
    const id = crypto.randomUUID(),
      created_at = new Date().toISOString();
    await this.db.prepare('INSERT INTO records (id,created_at,input,response,request_id) VALUES (?,?,?,?,?) ON CONFLICT(request_id) DO NOTHING').bind(id, created_at, input, response, request_id).run();
    const record = await this.db.prepare('SELECT * FROM records WHERE request_id=?').bind(request_id).first();
    if (!record) throw new Error('storage unavailable');
    if (record.input !== input || record.response !== response) throw new ValidationError('request_id reused with different content');
    return {
      ...record,
      inserted: record.id === id
    };
  }
  async get(id) {
    str(id, 'id', 128);
    return this.db.prepare('SELECT * FROM records WHERE id=?').bind(id).first();
  }
  async list({
    limit = 20,
    offset = 0,
    since
  } = {}) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new ValidationError('limit must be 1–100');
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) throw new ValidationError('offset must be 0–100000');
    let date;
    if (since !== undefined) {
      if (typeof since !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(since)) throw new ValidationError('since must be an ISO UTC date or timestamp');
      const parsed = new Date(since);
      if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== since.slice(0, 10)) throw new ValidationError('invalid since date');
      date = parsed.toISOString();
    }
    const filter = date === undefined ? '' : 'WHERE created_at>=?',
      args = date === undefined ? [] : [date];
    const [rows, count] = await this.db.batch([this.db.prepare(`SELECT * FROM records ${filter} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).bind(...args, limit, offset), this.db.prepare(`SELECT COUNT(*) AS n FROM records ${filter}`).bind(...args)]);
    return {
      items: rows.results,
      total: count.results[0].n,
      limit,
      offset,
      next_offset: offset + rows.results.length < count.results[0].n ? offset + rows.results.length : null
    };
  }
  async delete(id) {
    str(id, 'id', 128);
    const removed = await this.db.prepare('DELETE FROM records WHERE id=? RETURNING id').bind(id).first();
    return {
      deleted: removed?.id === id
    };
  }
}
