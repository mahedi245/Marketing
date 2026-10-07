import { createClient } from '@libsql/client';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');

let localDb = null;
let tursoClient = null;

const isTurso = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

if (isTurso) {
  tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  console.log('[Database] Connecting to Turso Cloud Database...');
} else {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'marketing.db');
  localDb = new DatabaseSync(dbPath);
  console.log(`[Database] Connecting to Local SQLite at ${dbPath}`);
}

export const db = {
  prepare(sql) {
    return {
      async all(...params) {
        if (isTurso) {
          const res = await tursoClient.execute({ sql, args: params.flat() });
          return res.rows;
        } else {
          return localDb.prepare(sql).all(...params.flat());
        }
      },
      async get(...params) {
        if (isTurso) {
          const res = await tursoClient.execute({ sql, args: params.flat() });
          return res.rows[0] || null;
        } else {
          return localDb.prepare(sql).get(...params.flat()) || null;
        }
      },
      async run(...params) {
        if (isTurso) {
          const res = await tursoClient.execute({ sql, args: params.flat() });
          return {
            lastInsertRowid: res.lastInsertRowid ? Number(res.lastInsertRowid) : null,
            changes: res.rowsAffected
          };
        } else {
          const res = localDb.prepare(sql).run(...params.flat());
          return {
            lastInsertRowid: res.lastInsertRowid ? Number(res.lastInsertRowid) : null,
            changes: res.changes
          };
        }
      }
    };
  },
  async exec(sql) {
    if (isTurso) {
      await tursoClient.executeMultiple(sql);
    } else {
      localDb.exec(sql);
    }
  }
};

export async function initDatabase() {
  if (!isTurso) {
    localDb.exec('PRAGMA journal_mode = WAL;');
    localDb.exec('PRAGMA foreign_keys = ON;');
  }

  // Create team_members table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      role TEXT DEFAULT 'Marketing Officer',
      active INTEGER NOT NULL DEFAULT 1,
      pin TEXT DEFAULT '1234',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure pin column exists if migrating from earlier schema
  try {
    const tableInfo = await db.prepare("PRAGMA table_info(team_members)").all();
    const hasPin = tableInfo.some((col) => col.name === 'pin');
    if (!hasPin) {
      await db.exec("ALTER TABLE team_members ADD COLUMN pin TEXT DEFAULT '1234'");
    }
  } catch (err) {
    console.error('Migration warning (pin column):', err.message);
  }

  // Create visits table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      site_name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      visit_date DATE NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Interested', 'Follow-up', 'Need Quotation', 'Closed/Won', 'Not Interested')),
      notes TEXT,
      next_follow_up_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE RESTRICT
    );
  `);

  // Create app_settings table (stores admin PIN and app configuration)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default admin PIN (default: '8888')
  const getAdminPin = await db.prepare("SELECT value FROM app_settings WHERE key = 'admin_pin'").get();
  if (!getAdminPin) {
    await db.prepare("INSERT INTO app_settings (key, value) VALUES ('admin_pin', '8888')").run();
  }

  // Indexes for query performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON visits(visit_date DESC);
    CREATE INDEX IF NOT EXISTS idx_visits_member_id ON visits(member_id);
    CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
    CREATE INDEX IF NOT EXISTS idx_visits_next_follow_up ON visits(next_follow_up_date);
    CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(active);
  `);

  console.log(`[Database] SQLite/Turso initialized successfully.`);
}
