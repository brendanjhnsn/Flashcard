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
let tokenA: string
let tokenB: string

async function register(email: string, password = 'password123') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password })
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`)
  return res.body.token as string
}

beforeEach(async () => {
  uploadDir = mkdtempSync(join(tmpdir(), 'fc-test-'))
  db = new Database(':memory:')
  initSchema(db)
  app = createApp(db, uploadDir)
  tokenA = await register('alice@example.com')
  tokenB = await register('bob@example.com')
})

afterEach(() => {
  db.close()
  rmSync(uploadDir, { recursive: true, force: true })
})

describe('GET /api/cards', () => {
  it('returns an empty array when user has no cards', async () => {
    const res = await request(app)
      .get('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/cards')
    expect(res.status).toBe(401)
  })

  it("only returns the current user's own cards", async () => {
    // Alice creates a card
    await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Alice front', back_text: 'Alice back' })

    // Bob's list should be empty
    const res = await request(app)
      .get('/api/cards')
      .set('Authorization', `Bearer ${tokenB}`)
    expect(res.body).toEqual([])
  })
})

describe('POST /api/cards', () => {
  it('creates a card with text on both sides', async () => {
    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'What is 2+2?', back_text: '4' })
    expect(res.status).toBe(201)
    expect(res.body.front_text).toBe('What is 2+2?')
    expect(res.body.back_text).toBe('4')
    expect(res.body.id).toBeDefined()
  })

  it('creates a card with an image URL on front', async () => {
    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_image_url: 'https://example.com/img.jpg', back_text: 'A photo' })
    expect(res.status).toBe(201)
    expect(res.body.front_image_url).toBe('https://example.com/img.jpg')
  })

  it('returns 400 when front has neither text nor image', async () => {
    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ back_text: 'Back only' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when back has neither text nor image', async () => {
    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Front only' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/cards')
      .send({ front_text: 'Q', back_text: 'A' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/cards/:id', () => {
  it('returns a card owned by the current user', async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Q', back_text: 'A' })

    const res = await request(app)
      .get(`/api/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(created.body.id)
  })

  it("returns 403 when accessing another user's card", async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Q', back_text: 'A' })

    const res = await request(app)
      .get(`/api/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
    expect(res.status).toBe(403)
  })

  it('returns 404 for a card that does not exist', async () => {
    const res = await request(app)
      .get('/api/cards/99999')
      .set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/cards/:id', () => {
  it('updates a card and returns the updated record', async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Old', back_text: 'Back' })

    const res = await request(app)
      .put(`/api/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'New', back_text: 'Back' })
    expect(res.status).toBe(200)
    expect(res.body.front_text).toBe('New')
  })

  it("returns 403 when updating another user's card", async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Q', back_text: 'A' })

    const res = await request(app)
      .put(`/api/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ front_text: 'Hacked', back_text: 'A' })
    expect(res.status).toBe(403)
  })

  it('returns 404 for a card that does not exist', async () => {
    const res = await request(app)
      .put('/api/cards/99999')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Q', back_text: 'A' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/cards/:id', () => {
  it('deletes a card and returns 204', async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Q', back_text: 'A' })

    const res = await request(app)
      .delete(`/api/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(204)

    // Verify it's gone
    const check = await request(app)
      .get(`/api/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(check.status).toBe(404)
  })

  it("returns 403 when deleting another user's card", async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Q', back_text: 'A' })

    const res = await request(app)
      .delete(`/api/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
    expect(res.status).toBe(403)
  })
})
