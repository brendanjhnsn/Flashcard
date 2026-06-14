import 'dotenv/config'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import { createDb, initSchema } from './db'
import { createApp } from './app'

const uploadDir = path.join(__dirname, 'uploads')
// Create the uploads directory if it doesn't exist
fs.mkdirSync(uploadDir, { recursive: true })

const dbPath = process.env.DATABASE_PATH ?? path.join(__dirname, '..', 'flashcard.db')
const db = createDb(dbPath)
initSchema(db)

// Seed admin account from .env on first startup
const adminEmail = process.env.ADMIN_EMAIL
const adminPassword = process.env.ADMIN_PASSWORD
if (adminEmail && adminPassword) {
  const existing = db.prepare('SELECT id, role FROM users WHERE email = ?').get(adminEmail) as { id: number; role: string } | undefined
  if (!existing) {
    const hash = bcrypt.hashSync(adminPassword, 12)
    db.prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'admin')").run(adminEmail, hash)
    console.log(`Admin account created: ${adminEmail}`)
  } else if (existing.role !== 'admin') {
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id)
    console.log(`Admin role granted to existing account: ${adminEmail}`)
  }
}

const app = createApp(db, uploadDir)
const PORT = Number(process.env.PORT ?? 3001)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
