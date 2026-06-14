import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { Db } from '../db'

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } })
    return
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret') as { userId: number }
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } })
  }
}

// Runs after requireAuth — looks up the user's role in the DB and blocks non-admins
export function requireAdmin(db: Db) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const row = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId) as { role: string } | undefined
    if (!row || row.role !== 'admin') {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } })
      return
    }
    next()
  }
}
