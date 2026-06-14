import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import type { Db } from '../db'
import { requireAuth, requireAdmin } from '../middleware/auth'
import type { User, Card } from '../types'

const BCRYPT_ROUNDS = process.env.NODE_ENV === 'test' ? 2 : 12

const createUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  role: z.enum(['user', 'admin']).default('user'),
})

const updateUserSchema = z
  .object({
    role: z.enum(['user', 'admin']).optional(),
    password: z.string().min(8).max(72).optional(),
  })
  .refine((d) => d.role !== undefined || d.password !== undefined, {
    message: 'Provide at least one of role or password',
  })

export function adminRouter(db: Db) {
  const router = Router()

  // All admin routes require auth + admin role
  router.use(requireAuth, requireAdmin(db))

  // ── Users ──────────────────────────────────────────────────────────────

  router.get('/users', (_req, res) => {
    const users = db
      .prepare('SELECT id, email, role, created_at FROM users ORDER BY created_at ASC')
      .all() as Omit<User, 'password_hash'>[]
    res.json(users)
  })

  router.post('/users', (req, res) => {
    const parse = createUserSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues.map((i) => i.message).join('; ') },
      })
    }

    const { email, password, role } = parse.data
    const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS)

    try {
      const user = db
        .prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?) RETURNING id, email, role, created_at')
        .get(email, hash, role) as Omit<User, 'password_hash'>
      return res.status(201).json(user)
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).message?.includes('UNIQUE constraint')) {
        return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'Email already registered' } })
      }
      console.error(err)
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
    }
  })

  router.delete('/users/:id', (req, res) => {
    const targetId = Number(req.params.id)

    // Prevent admins from deleting their own account
    if (targetId === req.userId!) {
      return res.status(400).json({ error: { code: 'CANNOT_DELETE_SELF', message: 'Cannot delete your own account' } })
    }

    const info = db.prepare('DELETE FROM users WHERE id = ?').run(targetId)
    if (info.changes === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } })
    }
    return res.status(204).send()
  })

  router.patch('/users/:id', (req, res) => {
    const targetId = Number(req.params.id)

    const parse = updateUserSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues.map((i) => i.message).join('; ') },
      })
    }

    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId) as { id: number } | undefined
    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } })
    }

    const { role, password } = parse.data
    if (role !== undefined) {
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, targetId)
    }
    if (password !== undefined) {
      const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS)
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, targetId)
    }

    const updated = db
      .prepare('SELECT id, email, role, created_at FROM users WHERE id = ?')
      .get(targetId) as Omit<User, 'password_hash'>
    return res.json(updated)
  })

  // ── Cards (all users) ──────────────────────────────────────────────────

  router.get('/cards', (_req, res) => {
    const cards = db
      .prepare(`
        SELECT c.id, c.user_id, u.email AS user_email,
               c.front_text, c.front_image_url,
               c.back_text, c.back_image_url,
               c.is_public, c.created_at, c.updated_at
        FROM cards c
        JOIN users u ON u.id = c.user_id
        ORDER BY c.created_at DESC
      `)
      .all() as (Card & { user_email: string })[]
    res.json(cards)
  })

  router.patch('/cards/:id', (req, res) => {
    const parse = z.object({ is_public: z.boolean() }).safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues.map((i) => i.message).join('; ') },
      })
    }

    const info = db
      .prepare('UPDATE cards SET is_public = ? WHERE id = ?')
      .run(parse.data.is_public ? 1 : 0, req.params.id)
    if (info.changes === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } })
    }

    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id) as Card
    return res.json(card)
  })

  router.delete('/cards/:id', (req, res) => {
    const info = db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id)
    if (info.changes === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } })
    }
    return res.status(204).send()
  })

  return router
}
