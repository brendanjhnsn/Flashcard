import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import Database from 'better-sqlite3'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { initSchema } from '../db'
import { createApp } from '../app'

let db: InstanceType<typeof Database>
let app: ReturnType<typeof createApp>
let uploadDir: string
let userToken: string

async function registerUser(email: string, password = 'password123') {
  const res = await request(app).post('/api/auth/register').send({ email, password })
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`)
  return res.body.token as string
}

beforeEach(async () => {
  uploadDir = mkdtempSync(join(tmpdir(), 'fc-public-test-'))
  db = new Database(':memory:')
  initSchema(db)
  app = createApp(db, uploadDir)
  userToken = await registerUser('user@example.com')
})

afterEach(() => {
  db.close()
  rmSync(uploadDir, { recursive: true, force: true })
})

describe('GET /api/public/cards', () => {
  it('returns only public cards without authentication', async () => {
    await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ front_text: 'Public Q', back_text: 'Public A', is_public: true })
    await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ front_text: 'Private Q', back_text: 'Private A', is_public: false })

    const res = await request(app).get('/api/public/cards')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].front_text).toBe('Public Q')
    expect(res.body[0].user_email).toBeDefined()
  })

  it('returns an empty array when no cards are public', async () => {
    await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ front_text: 'Private Q', back_text: 'Private A' })

    const res = await request(app).get('/api/public/cards')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  it('includes user_email on each card', async () => {
    await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ front_text: 'Q', back_text: 'A', is_public: true })

    const res = await request(app).get('/api/public/cards')
    expect(res.body[0].user_email).toBe('user@example.com')
  })
})
