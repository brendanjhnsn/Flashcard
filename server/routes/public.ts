import { Router } from 'express'
import type { Db } from '../db'
import type { Card } from '../types'

export function publicRouter(db: Db) {
  const router = Router()

  router.get('/cards', (_req, res) => {
    const cards = db
      .prepare(`
        SELECT c.id, c.user_id, u.email AS user_email,
               c.front_text, c.front_image_url,
               c.back_text, c.back_image_url,
               c.is_public, c.created_at, c.updated_at
        FROM cards c
        JOIN users u ON u.id = c.user_id
        WHERE c.is_public = 1
        ORDER BY c.created_at DESC
      `)
      .all() as (Card & { user_email: string })[]
    res.json(cards)
  })

  return router
}
