import { Router } from 'express'
import type { Db } from '../db'
import { requireAuth } from '../middleware/auth'
import { cardBodySchema } from '../schemas/cards'
import type { Card } from '../types'

export function cardsRouter(db: Db) {
  const router = Router()

  // All card routes require a valid JWT
  router.use(requireAuth)

  router.get('/', (req, res) => {
    const cards = db
      .prepare('SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC')
      .all(req.userId!)
    res.json(cards)
  })

  router.get('/:id', (req, res) => {
    const card = db
      .prepare('SELECT * FROM cards WHERE id = ?')
      .get(req.params.id) as Card | undefined

    if (!card) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } })
    }
    if (card.user_id !== req.userId!) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
    }
    return res.json(card)
  })

  router.post('/', (req, res) => {
    const parse = cardBodySchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues.map((i) => i.message).join('; ') },
      })
    }

    const { front_text, front_image_url, back_text, back_image_url, is_public } = parse.data
    const card = db
      .prepare(`
        INSERT INTO cards (user_id, front_text, front_image_url, back_text, back_image_url, is_public)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .get(
        req.userId!,
        front_text ?? null,
        front_image_url ?? null,
        back_text ?? null,
        back_image_url ?? null,
        is_public ? 1 : 0
      ) as Card

    return res.status(201).json(card)
  })

  router.put('/:id', (req, res) => {
    // Validate body first so a malformed request never hits the DB
    const parse = cardBodySchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues.map((i) => i.message).join('; ') },
      })
    }

    const card = db
      .prepare('SELECT * FROM cards WHERE id = ?')
      .get(req.params.id) as Card | undefined

    if (!card) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } })
    }
    if (card.user_id !== req.userId!) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
    }

    const { front_text, front_image_url, back_text, back_image_url, is_public } = parse.data
    const updated = db
      .prepare(`
        UPDATE cards
        SET front_text = ?, front_image_url = ?, back_text = ?, back_image_url = ?,
            is_public = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
        WHERE id = ?
        RETURNING *
      `)
      .get(
        front_text ?? null,
        front_image_url ?? null,
        back_text ?? null,
        back_image_url ?? null,
        is_public ? 1 : 0,
        req.params.id
      ) as Card

    return res.json(updated)
  })

  router.delete('/:id', (req, res) => {
    const card = db
      .prepare('SELECT * FROM cards WHERE id = ?')
      .get(req.params.id) as Card | undefined

    if (!card) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } })
    }
    if (card.user_id !== req.userId!) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
    }

    db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id)
    return res.status(204).send()
  })

  return router
}
