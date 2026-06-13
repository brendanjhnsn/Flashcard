import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import Database from 'better-sqlite3'
import { mkdtempSync, rmSync, readdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { initSchema } from '../db'
import { createApp } from '../app'

let db: InstanceType<typeof Database>
let app: ReturnType<typeof createApp>
let uploadDir: string
let token: string

beforeEach(async () => {
  uploadDir = mkdtempSync(join(tmpdir(), 'fc-upload-test-'))
  db = new Database(':memory:')
  initSchema(db)
  app = createApp(db, uploadDir)
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'alice@example.com', password: 'password123' })
  token = res.body.token
})

afterEach(() => {
  db.close()
  rmSync(uploadDir, { recursive: true, force: true })
})

describe('POST /api/uploads', () => {
  it('uploads a JPEG and returns a URL', async () => {
    // A minimal valid 1x1 JPEG in binary
    const jpegBuffer = Buffer.from(
      'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffd9',
      'hex'
    )
    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', jpegBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' })

    expect(res.status).toBe(201)
    expect(res.body.url).toMatch(/^\/uploads\/.+\.jpg$/)

    // File should exist on disk
    const files = readdirSync(uploadDir)
    expect(files.length).toBe(1)
  })

  it('returns 400 for a non-image file type', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('not an image'), { filename: 'file.txt', contentType: 'text/plain' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE')
  })

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .attach('image', Buffer.from('data'), { filename: 'test.jpg', contentType: 'image/jpeg' })
    expect(res.status).toBe(401)
  })
})
