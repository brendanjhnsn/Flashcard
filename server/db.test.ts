import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema } from './db'

let db: InstanceType<typeof Database>

beforeEach(() => {
  db = new Database(':memory:')
})

afterEach(() => {
  db.close()
})

describe('initSchema', () => {
  it('creates the users table', () => {
    initSchema(db)
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
      .get()
    expect(row).toBeTruthy()
  })

  it('creates the cards table', () => {
    initSchema(db)
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cards'")
      .get()
    expect(row).toBeTruthy()
  })

  it('is idempotent — running twice does not throw', () => {
    expect(() => {
      initSchema(db)
      initSchema(db)
    }).not.toThrow()
  })
})
