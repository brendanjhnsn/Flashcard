import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { extname } from 'path'
import { v4 as uuid } from 'uuid'
import type { Db } from '../db'
import { requireAuth } from '../middleware/auth'

export function uploadsRouter(_db: Db, uploadDir: string) {
  const router = Router()

  const storage = multer.diskStorage({
    destination: uploadDir,
    filename(_req, file, cb) {
      // Unique filename to avoid collisions
      cb(null, `${uuid()}${extname(file.originalname)}`)
    },
  })

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter(_req, file, cb) {
      const allowed = ['image/jpeg', 'image/png', 'image/webp']
      if (allowed.includes(file.mimetype)) {
        cb(null, true)
      } else {
        cb(new Error('INVALID_FILE_TYPE'))
      }
    },
  })

  router.post(
    '/',
    requireAuth,
    (req: Request, res: Response, next: NextFunction) => {
      upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res
            .status(400)
            .json({ error: { code: 'UPLOAD_ERROR', message: err.message } })
        }
        if (err instanceof Error) {
          if (err.message === 'INVALID_FILE_TYPE') {
            return res.status(400).json({
              error: { code: 'INVALID_FILE_TYPE', message: 'Only JPEG, PNG, and WebP are allowed' },
            })
          }
          return next(err)
        }
        next()
      })
    },
    (req: Request, res: Response) => {
      if (!req.file) {
        return res.status(400).json({
          error: { code: 'MISSING_FILE', message: 'No image file provided' },
        })
      }
      const url = `/uploads/${req.file.filename}`
      return res.status(201).json({ url })
    }
  )

  return router
}
