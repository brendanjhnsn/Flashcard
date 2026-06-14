import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Db } from '../db'
import { registerSchema, loginSchema } from '../schemas/auth'
import type { User } from '../types'

// Low rounds in test env so tests run fast; 12 is secure for production
const BCRYPT_ROUNDS = process.env.NODE_ENV === 'test' ? 2 : 12

function signToken(userId: number): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET ?? 'dev-secret', { expiresIn: '7d' })
}

export function authRouter(db: Db) {
  const router = Router()

  router.post('/register', (req, res) => {
    const parse = registerSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues.map((i) => i.message).join('; ') },
      })
    }

    const { email, password } = parse.data
    const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS)

    try {
      const user = db
        .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id, email, role')
        .get(email, passwordHash) as Pick<User, 'id' | 'email' | 'role'>

      const token = signToken(user.id)
      return res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } })
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).message?.includes('UNIQUE constraint')) {
        return res.status(409).json({
          error: { code: 'EMAIL_TAKEN', message: 'Email already registered' },
        })
      }
      console.error(err)
      return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      })
    }
  })

  router.post('/login', (req, res) => {
    const parse = loginSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues.map((i) => i.message).join('; ') },
      })
    }

    const { email, password } = parse.data
    const user = db
      .prepare('SELECT id, email, password_hash, role, created_at FROM users WHERE email = ?')
      .get(email) as User | undefined

    // Use the same error for wrong email and wrong password to avoid user enumeration
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      })
    }

    const token = signToken(user.id)
    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    })
  })

  return router
}
