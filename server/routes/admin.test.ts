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
let adminToken: string
let userToken: string

async function createUser(email: string, password = 'password123', role: 'user' | 'admin' = 'user') {
  const res = await request(app).post('/api/auth/register').send({ email, password })
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`)
  // Promote to admin directly in DB if needed
  if (role === 'admin') {
    db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email)
  }
  return res.body.token as string
}

beforeEach(async () => {
  uploadDir = mkdtempSync(join(tmpdir(), 'fc-admin-test-'))
  db = new Database(':memory:')
  initSchema(db)
  app = createApp(db, uploadDir)
  adminToken = await createUser('admin@example.com', 'password123', 'admin')
  userToken = await createUser('user@example.com', 'password123', 'user')
})

afterEach(() => {
  db.close()
  rmSync(uploadDir, { recursive: true, force: true })
})

// ── GET /api/admin/users ──────────────────────────────────────────────────

describe('GET /api/admin/users', () => {
  it('returns all users for an admin', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].password_hash).toBeUndefined()
    expect(res.body[0].role).toBeDefined()
  })

  it('returns 403 for a regular user', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${userToken}`)
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/admin/users')
    expect(res.status).toBe(401)
  })
})

// ── POST /api/admin/users ─────────────────────────────────────────────────

describe('POST /api/admin/users', () => {
  it('creates a new user as admin', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'new@example.com', password: 'password123' })
    expect(res.status).toBe(201)
    expect(res.body.email).toBe('new@example.com')
    expect(res.body.role).toBe('user')
    expect(res.body.password_hash).toBeUndefined()
  })

  it('creates an admin user when role=admin', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'newadmin@example.com', password: 'password123', role: 'admin' })
    expect(res.status).toBe(201)
    expect(res.body.role).toBe('admin')
  })

  it('returns 409 for duplicate email', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'user@example.com', password: 'password123' })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('EMAIL_TAKEN')
  })

  it('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'not-an-email', password: 'password123' })
    expect(res.status).toBe(400)
  })

  it('returns 403 for a regular user', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: 'new@example.com', password: 'password123' })
    expect(res.status).toBe(403)
  })
})

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────

describe('DELETE /api/admin/users/:id', () => {
  it('deletes another user and returns 204', async () => {
    const userId = (db.prepare("SELECT id FROM users WHERE email = 'user@example.com'").get() as { id: number }).id
    const res = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(204)
  })

  it('returns 400 when admin tries to delete themselves', async () => {
    const adminId = (db.prepare("SELECT id FROM users WHERE email = 'admin@example.com'").get() as { id: number }).id
    const res = await request(app)
      .delete(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('CANNOT_DELETE_SELF')
  })

  it('returns 404 for a non-existent user', async () => {
    const res = await request(app)
      .delete('/api/admin/users/99999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })

  it('returns 403 for a regular user', async () => {
    const userId = (db.prepare("SELECT id FROM users WHERE email = 'user@example.com'").get() as { id: number }).id
    const res = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
    expect(res.status).toBe(403)
  })
})

// ── PATCH /api/admin/users/:id ────────────────────────────────────────────

describe('PATCH /api/admin/users/:id', () => {
  it('promotes a user to admin', async () => {
    const userId = (db.prepare("SELECT id FROM users WHERE email = 'user@example.com'").get() as { id: number }).id
    const res = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' })
    expect(res.status).toBe(200)
    expect(res.body.role).toBe('admin')
    expect(res.body.password_hash).toBeUndefined()
  })

  it('demotes an admin to user', async () => {
    const userId = (db.prepare("SELECT id FROM users WHERE email = 'user@example.com'").get() as { id: number }).id
    const res = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' })
    expect(res.status).toBe(200)
    expect(res.body.role).toBe('user')
  })

  it('resets a user password', async () => {
    const userId = (db.prepare("SELECT id FROM users WHERE email = 'user@example.com'").get() as { id: number }).id
    const res = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ password: 'newpassword123' })
    expect(res.status).toBe(200)
    // Verify new password works by logging in
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'newpassword123' })
    expect(login.status).toBe(200)
  })

  it('can update role and password together', async () => {
    const userId = (db.prepare("SELECT id FROM users WHERE email = 'user@example.com'").get() as { id: number }).id
    const res = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin', password: 'newpassword123' })
    expect(res.status).toBe(200)
    expect(res.body.role).toBe('admin')
  })

  it('returns 400 when body is empty', async () => {
    const userId = (db.prepare("SELECT id FROM users WHERE email = 'user@example.com'").get() as { id: number }).id
    const res = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect(res.status).toBe(400)
  })

  it('returns 400 for a password shorter than 8 chars', async () => {
    const userId = (db.prepare("SELECT id FROM users WHERE email = 'user@example.com'").get() as { id: number }).id
    const res = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ password: 'short' })
    expect(res.status).toBe(400)
  })

  it('returns 404 for a non-existent user', async () => {
    const res = await request(app)
      .patch('/api/admin/users/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' })
    expect(res.status).toBe(404)
  })

  it('returns 403 for a regular user', async () => {
    const userId = (db.prepare("SELECT id FROM users WHERE email = 'user@example.com'").get() as { id: number }).id
    const res = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ role: 'admin' })
    expect(res.status).toBe(403)
  })
})

// ── GET /api/admin/cards ──────────────────────────────────────────────────

describe('GET /api/admin/cards', () => {
  it('returns all cards from all users', async () => {
    // User creates a card
    await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ front_text: 'Q', back_text: 'A' })
    // Admin creates a card
    await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ front_text: 'Q2', back_text: 'A2' })

    const res = await request(app).get('/api/admin/cards').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].user_email).toBeDefined()
    expect(res.body[0].is_public).toBeDefined()
  })

  it('returns 403 for a regular user', async () => {
    const res = await request(app).get('/api/admin/cards').set('Authorization', `Bearer ${userToken}`)
    expect(res.status).toBe(403)
  })
})

// ── PATCH /api/admin/cards/:id ────────────────────────────────────────────

describe('PATCH /api/admin/cards/:id', () => {
  it('sets a card to public', async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ front_text: 'Q', back_text: 'A' })

    const res = await request(app)
      .patch(`/api/admin/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_public: true })
    expect(res.status).toBe(200)
    expect(res.body.is_public).toBe(1)
  })

  it('sets a card to private', async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ front_text: 'Q', back_text: 'A', is_public: true })

    const res = await request(app)
      .patch(`/api/admin/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_public: false })
    expect(res.status).toBe(200)
    expect(res.body.is_public).toBe(0)
  })

  it('returns 404 for a non-existent card', async () => {
    const res = await request(app)
      .patch('/api/admin/cards/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_public: true })
    expect(res.status).toBe(404)
  })

  it('returns 403 for a regular user', async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ front_text: 'Q', back_text: 'A' })

    const res = await request(app)
      .patch(`/api/admin/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ is_public: true })
    expect(res.status).toBe(403)
  })
})

// ── DELETE /api/admin/cards/:id ───────────────────────────────────────────

describe('DELETE /api/admin/cards/:id', () => {
  it("deletes any user's card and returns 204", async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ front_text: 'Q', back_text: 'A' })

    const res = await request(app)
      .delete(`/api/admin/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(204)
  })

  it('returns 404 for a non-existent card', async () => {
    const res = await request(app)
      .delete('/api/admin/cards/99999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })

  it('returns 403 for a regular user', async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ front_text: 'Q', back_text: 'A' })

    const res = await request(app)
      .delete(`/api/admin/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
    expect(res.status).toBe(403)
  })
})
