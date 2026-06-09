/**
 * SQLite-Datenbankverbindung via better-sqlite3 + Drizzle ORM.
 * Die DB-Datei liegt in /app/data/receipts.db (Docker-Volume).
 *
 * Lazy-Initialisierung: Die Verbindung wird erst beim ersten echten
 * Zugriff geöffnet, nicht beim Import (wichtig für Next.js Build-Phase).
 */
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'
import fs from 'fs'

type DbType = BetterSQLite3Database<typeof schema>

let _db: DbType | null = null

function getInstance(): DbType {
  if (_db) return _db

  const DB_DIR  = path.join(process.cwd(), 'data')
  const DB_PATH = path.join(DB_DIR, 'receipts.db')

  fs.mkdirSync(DB_DIR, { recursive: true })

  const sqlite = new Database(DB_PATH)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('busy_timeout = 5000')
  sqlite.pragma('foreign_keys = ON')

  // Tabellen beim ersten Start anlegen
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      email      TEXT NOT NULL UNIQUE,
      password   TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      title       TEXT NOT NULL,
      amount      REAL NOT NULL,
      currency    TEXT NOT NULL DEFAULT 'EUR',
      date        TEXT NOT NULL,
      category    TEXT NOT NULL,
      vendor      TEXT,
      description TEXT,
      image_url   TEXT,
      raw_text    TEXT,
      items       TEXT DEFAULT '[]',
      tags        TEXT NOT NULL DEFAULT '[]',
      is_synced   INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `)

  _db = drizzle(sqlite, { schema })
  return _db
}

// Proxy: gleiche Schnittstelle wie ein direktes drizzle-Objekt,
// aber die Verbindung wird erst beim ersten Methodenaufruf geöffnet.
export const db = new Proxy({} as DbType, {
  get(_, prop: string | symbol) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getInstance() as any)[prop]
  },
})
