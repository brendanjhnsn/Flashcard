import path from 'path'
import fs from 'fs'
import { createDb, initSchema } from './db'
import { createApp } from './app'

const uploadDir = path.join(__dirname, 'uploads')
// Create the uploads directory if it doesn't exist
fs.mkdirSync(uploadDir, { recursive: true })

const dbPath = process.env.DATABASE_PATH ?? path.join(__dirname, '..', 'flashcard.db')
const db = createDb(dbPath)
initSchema(db)

const app = createApp(db, uploadDir)
const PORT = Number(process.env.PORT ?? 3001)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
