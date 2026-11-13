import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
export class D1 {
  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA foreign_keys=ON');
  }
  prepare(sql) {
    const statement = this.db.prepare(sql);
    let args = [];
    const s = {
      bind(...a) {
        args = a;
        return s;
      },
      async first() {
        return statement.get(...args) ?? null;
      },
      async all() {
        return {
          results: statement.all(...args)
        };
      },
      async run() {
        statement.run(...args);
        return {
          success: true
        };
      },
      sync() {
        return {
          results: statement.all(...args)
        };
      }
    };
    return s;
  }
  async batch(statements) {
    this.db.exec('BEGIN');
    try {
      const result = statements.map(s => s.sync());
      this.db.exec('COMMIT');
      return result;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }
  migrate() {
    for (const f of readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort()) this.db.exec(readFileSync(join('drizzle', f), 'utf8'));
  }
}
