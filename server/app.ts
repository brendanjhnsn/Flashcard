import express from 'express'
import path from 'path'
import type { Db } from './db'
import { authRouter } from './routes/auth'
import { cardsRouter } from './routes/cards'
import { uploadsRouter } from './routes/uploads'
import { adminRouter } from './routes/admin'

export function createApp(db: Db, uploadDir: string) {
  const app = express()

  app.use(express.json())

  // Serve uploaded images as static files
  app.use('/uploads', express.static(uploadDir))

  // API routes
  app.use('/api/auth', authRouter(db))
  app.use('/api/cards', cardsRouter(db))
  app.use('/api/uploads', uploadsRouter(db, uploadDir))
  app.use('/api/admin', adminRouter(db))

  // 404 for unmatched /api routes (must come before the SPA wildcard so /api/* doesn't fall through to index.html)
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } })
  })

  // In production Express serves the Vite build (only reached by non-/api routes)
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(process.cwd(), 'dist')
    app.use(express.static(distDir))
    app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
  }

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
  })

  return app
}
