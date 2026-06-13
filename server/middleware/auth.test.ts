import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { requireAuth } from './auth'

const SECRET = process.env.JWT_SECRET!

function makeTestApp() {
  const app = express()
  app.get('/protected', requireAuth, (req, res) => {
    res.json({ userId: req.userId })
  })
  return app
}

describe('requireAuth middleware', () => {
  it('allows a request with a valid JWT', async () => {
    const token = jwt.sign({ userId: 42 }, SECRET)
    const res = await request(makeTestApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.userId).toBe(42)
  })

  it('returns 401 when no Authorization header is sent', async () => {
    const res = await request(makeTestApp()).get('/protected')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 401 when the token is invalid', async () => {
    const res = await request(makeTestApp())
      .get('/protected')
      .set('Authorization', 'Bearer this.is.garbage')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})
