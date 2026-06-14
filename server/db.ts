import Database from 'better-sqlite3'

export type Db = InstanceType<typeof Database>

export function createDb(path: string): Db {
  const db = new Database(path)
  // Enable foreign key enforcement (SQLite disables it by default)
  db.pragma('foreign_keys = ON')
  return db
}

export function initSchema(db: Db): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'user',
      created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS cards (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      front_text      TEXT,
      front_image_url TEXT,
      back_text       TEXT,
      back_image_url  TEXT,
      is_public       INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
      updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
  `)

  // Idempotent migrations for existing databases
  const userCols = (db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map((c) => c.name)
  if (!userCols.includes('role')) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'")
  }

  const cardCols = (db.prepare('PRAGMA table_info(cards)').all() as { name: string }[]).map((c) => c.name)
  if (!cardCols.includes('is_public')) {
    db.exec('ALTER TABLE cards ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0')
  }
}
