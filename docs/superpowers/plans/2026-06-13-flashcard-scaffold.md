# Flashcard App — Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a full-stack flashcard app with React/Vite frontend, Express/SQLite backend, JWT auth, image upload, and TDD from the start.

**Architecture:** Single package — Vite serves React from `src/` in dev (`:5173`, proxying `/api` and `/uploads` to Express `:3001`). Express at `server/` serves JSON API + static uploads. In production, Express serves the Vite build from `dist/`. `server/app.ts` exports `createApp(db, uploadDir)` so routes are testable without starting the HTTP server.

**Tech Stack:** React 18, React Router 6, React Hook Form + Zod, Vite 5, Express 4, better-sqlite3, bcryptjs, jsonwebtoken, multer, Zod, Vitest, Supertest, Playwright, Husky, TypeScript 5, tsx

---

## Constraints

- **Test-first (TDD).** Tests come first, always. Spend edge-case depth on high-impact paths (core logic, API contracts, user flows); keep trivial tests minimal.
- **Validate frontend inputs.** Required fields, types, length limits, basic format checks.
- **Write for a junior-to-mid dev.** Clear and conventional over clever.
- **Why-comments** (optional). Short explanations where they help a beginner.
- **Validation:** Zod at the API route boundary.
- **Tests:** Vitest; API routes via Supertest on an in-memory SQLite DB.
- **E2E:** Playwright, in `/e2e` (CI, not pre-commit).
- **Errors:** Return `{ error: { code, message } }`; 404 for unknown routes/resources; log internals, never send them.
- **Pre-commit:** Runs lint + unit + API tests. Never bypass with `--no-verify`.

---

## File Map

```
Flashcard/
├── src/
│   ├── main.tsx                        Task 9
│   ├── App.tsx                         Task 9
│   ├── api/
│   │   ├── client.ts                   Task 8
│   │   ├── auth.ts                     Task 8
│   │   ├── cards.ts                    Task 8
│   │   └── uploads.ts                  Task 8
│   ├── context/
│   │   └── AuthContext.tsx             Task 9
│   ├── components/
│   │   ├── ProtectedRoute.tsx          Task 9
│   │   ├── CardItem.tsx                Task 11
│   │   └── CardForm.tsx                Task 11
│   └── pages/
│       ├── LoginPage.tsx               Task 10
│       ├── RegisterPage.tsx            Task 10
│       └── CardsPage.tsx               Task 11
├── server/
│   ├── types.ts                        Task 2
│   ├── db.ts                           Task 2
│   ├── db.test.ts                      Task 2
│   ├── schemas/
│   │   ├── auth.ts                     Task 3
│   │   └── cards.ts                    Task 3
│   ├── middleware/
│   │   ├── auth.ts                     Task 3
│   │   └── auth.test.ts                Task 3
│   ├── routes/
│   │   ├── auth.ts                     Task 4
│   │   ├── auth.test.ts                Task 4
│   │   ├── cards.ts                    Task 5
│   │   ├── cards.test.ts               Task 5
│   │   ├── uploads.ts                  Task 6
│   │   └── uploads.test.ts             Task 6
│   ├── app.ts                          Task 7
│   └── index.ts                        Task 7
├── e2e/
│   └── flashcards.spec.ts              Task 13
├── index.html                          Task 1
├── vite.config.ts                      Task 1
├── vitest.config.ts                    Task 1
├── vitest.setup.ts                     Task 1
├── tsconfig.json                       Task 1
├── tsconfig.server.json                Task 1
├── .eslintrc.json                      Task 1
├── playwright.config.ts                Task 13
├── package.json                        Task 1
└── .gitignore                          Task 1
```

---

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.server.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `.eslintrc.json`
- Create: `index.html`
- Modify: `.gitignore`

- [ ] **Step 1: Update `.gitignore`**

```
node_modules/
dist/
dist-server/
server/uploads/
.superpowers/
*.db
.env
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "flashcard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"vite\" \"tsx watch server/index.ts\"",
    "build": "vite build",
    "start": "tsx server/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src server --ext .ts,.tsx",
    "e2e": "playwright test",
    "prepare": "husky"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "bcryptjs": "^2.4.3",
    "better-sqlite3": "^9.6.0",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.52.1",
    "react-router-dom": "^6.24.0",
    "uuid": "^10.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@playwright/test": "^1.45.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/better-sqlite3": "^7.6.11",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.14.9",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/supertest": "^6.0.2",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^7.15.0",
    "@typescript-eslint/parser": "^7.15.0",
    "@vitejs/plugin-react": "^4.3.1",
    "concurrently": "^8.2.2",
    "eslint": "^8.57.0",
    "husky": "^9.0.11",
    "lint-staged": "^15.2.7",
    "supertest": "^7.0.0",
    "tsx": "^4.16.2",
    "typescript": "^5.5.3",
    "vite": "^5.3.3",
    "vitest": "^1.6.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix"]
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
npm install
```

Expected: packages install, `node_modules/` created, no errors.

- [ ] **Step 4: Create `tsconfig.json`** (IDE + Vite frontend)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Create `tsconfig.server.json`** (server files + test files)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "strict": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true
  },
  "include": ["server", "vitest.setup.ts"]
}
```

- [ ] **Step 6: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
})
```

- [ ] **Step 7: Create `vitest.setup.ts`**

```ts
// Set test environment variables before any test runs
process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod'
process.env.NODE_ENV = 'test'
```

- [ ] **Step 8: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

- [ ] **Step 9: Create `.eslintrc.json`**

```json
{
  "root": true,
  "env": { "node": true, "browser": true, "es2020": true },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

- [ ] **Step 10: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flashcard App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "chore: project setup — package.json, tsconfig, vite, vitest, eslint"
```

---

### Task 2: Database Setup

**Files:**
- Create: `server/types.ts`
- Create: `server/db.ts`
- Create: `server/db.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// server/db.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema } from './db'

let db: InstanceType<typeof Database>

beforeEach(() => {
  db = new Database(':memory:')
})

afterEach(() => {
  db.close()
})

describe('initSchema', () => {
  it('creates the users table', () => {
    initSchema(db)
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
      .get()
    expect(row).toBeTruthy()
  })

  it('creates the cards table', () => {
    initSchema(db)
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cards'")
      .get()
    expect(row).toBeTruthy()
  })

  it('is idempotent — running twice does not throw', () => {
    expect(() => {
      initSchema(db)
      initSchema(db)
    }).not.toThrow()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- db.test.ts
```

Expected: FAIL — cannot find module `./db`

- [ ] **Step 3: Create `server/types.ts`**

```ts
// Augment Express's Request type so TypeScript knows about req.userId
declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

export interface User {
  id: number
  email: string
  password_hash: string
  created_at: string
}

export interface Card {
  id: number
  user_id: number
  front_text: string | null
  front_image_url: string | null
  back_text: string | null
  back_image_url: string | null
  created_at: string
  updated_at: string
}
```

- [ ] **Step 4: Create `server/db.ts`**

```ts
import Database from 'better-sqlite3'

export type Db = InstanceType<typeof Database>

export function createDb(path: string): Db {
  const db = new Database(path)
  // Enable foreign key enforcement (SQLite disables it by default)
  db.pragma('foreign_keys = ON')
  return db
}

export function initSchema(db: Db): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS cards (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      front_text      TEXT,
      front_image_url TEXT,
      back_text       TEXT,
      back_image_url  TEXT,
      created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
      updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
  `)
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test -- db.test.ts
```

Expected: PASS — 3 tests

- [ ] **Step 6: Commit**

```bash
git add server/types.ts server/db.ts server/db.test.ts
git commit -m "feat: SQLite schema — users and cards tables"
```

---

### Task 3: Auth Middleware & Zod Schemas

**Files:**
- Create: `server/schemas/auth.ts`
- Create: `server/schemas/cards.ts`
- Create: `server/middleware/auth.ts`
- Create: `server/middleware/auth.test.ts`

- [ ] **Step 1: Write failing middleware tests**

```ts
// server/middleware/auth.test.ts
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- auth.test.ts
```

Expected: FAIL — cannot find module `./auth`

- [ ] **Step 3: Create `server/schemas/auth.ts`**

```ts
import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email().max(255),
  // bcrypt silently truncates at 72 chars — cap it here to avoid surprises
  password: z.string().min(8).max(72),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type RegisterBody = z.infer<typeof registerSchema>
export type LoginBody = z.infer<typeof loginSchema>
```

- [ ] **Step 4: Create `server/schemas/cards.ts`**

```ts
import { z } from 'zod'

// Each side (front / back) must have at least text or an image URL
const sideSchema = z
  .object({
    text: z.string().min(1).max(10_000).nullable().optional(),
    image_url: z.string().url().nullable().optional(),
  })
  .refine((d) => d.text != null || d.image_url != null, {
    message: 'Must have at least text or an image URL',
  })

export const cardBodySchema = z
  .object({
    front_text: z.string().min(1).max(10_000).nullable().optional(),
    front_image_url: z.string().url().nullable().optional(),
    back_text: z.string().min(1).max(10_000).nullable().optional(),
    back_image_url: z.string().url().nullable().optional(),
  })
  .refine((d) => d.front_text != null || d.front_image_url != null, {
    message: 'Front must have at least text or an image URL',
    path: ['front'],
  })
  .refine((d) => d.back_text != null || d.back_image_url != null, {
    message: 'Back must have at least text or an image URL',
    path: ['back'],
  })

export type CardBody = z.infer<typeof cardBodySchema>
```

- [ ] **Step 5: Create `server/middleware/auth.ts`**

```ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

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
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
npm test -- auth.test.ts
```

Expected: PASS — 3 tests

- [ ] **Step 7: Commit**

```bash
git add server/schemas/ server/middleware/
git commit -m "feat: Zod schemas and JWT auth middleware"
```

---

### Task 4: Auth Routes

**Files:**
- Create: `server/routes/auth.ts`
- Create: `server/routes/auth.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// server/routes/auth.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import Database from 'better-sqlite3'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { initSchema } from '../db'
import { createApp } from '../app'

let db: InstanceType<typeof Database>
let app: ReturnType<typeof createApp>
let uploadDir: string

beforeEach(() => {
  uploadDir = mkdtempSync(join(tmpdir(), 'fc-test-'))
  db = new Database(':memory:')
  initSchema(db)
  app = createApp(db, uploadDir)
})

afterEach(() => {
  db.close()
  rmSync(uploadDir, { recursive: true, force: true })
})

describe('POST /api/auth/register', () => {
  it('registers a new user and returns token + user (no password_hash)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'password123' })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('alice@example.com')
    expect(res.body.user.password_hash).toBeUndefined()
  })

  it('returns 400 for an invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when password is fewer than 8 chars', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'short' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 409 when email is already registered', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'password123' })
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'different123' })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('EMAIL_TAKEN')
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'password123' })
  })

  it('returns token + user on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('alice@example.com')
  })

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'wrongpassword' })
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('returns 401 for unknown email (same code as wrong password — no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'password123' })
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- routes/auth.test.ts
```

Expected: FAIL — cannot find module `../app`

- [ ] **Step 3: Create `server/routes/auth.ts`**

```ts
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Db } from '../db'
import { registerSchema, loginSchema } from '../schemas/auth'
import type { User } from '../types'

// Low rounds in test env so tests run fast; 12 is secure for production
const BCRYPT_ROUNDS = process.env.NODE_ENV === 'test' ? 2 : 12

export function authRouter(db: Db) {
  const router = Router()

  router.post('/register', (req, res) => {
    const parse = registerSchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parse.error.message },
      })
    }

    const { email, password } = parse.data
    const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS)

    try {
      const user = db
        .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id, email, created_at')
        .get(email, passwordHash) as Pick<User, 'id' | 'email' | 'created_at'>

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET ?? 'dev-secret',
        { expiresIn: '7d' }
      )
      return res.status(201).json({ token, user })
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
        error: { code: 'VALIDATION_ERROR', message: parse.error.message },
      })
    }

    const { email, password } = parse.data
    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as User | undefined

    // Use the same error for wrong email and wrong password to avoid user enumeration
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      })
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET ?? 'dev-secret',
      { expiresIn: '7d' }
    )
    return res.json({
      token,
      user: { id: user.id, email: user.email, created_at: user.created_at },
    })
  })

  return router
}
```

- [ ] **Step 4: Create `server/app.ts`** (needed so tests can import `createApp`)

```ts
import express from 'express'
import path from 'path'
import type { Db } from './db'
import { authRouter } from './routes/auth'
import { cardsRouter } from './routes/cards'
import { uploadsRouter } from './routes/uploads'

export function createApp(db: Db, uploadDir: string) {
  const app = express()

  app.use(express.json())

  // Serve uploaded images as static files
  app.use('/uploads', express.static(uploadDir))

  // API routes
  app.use('/api/auth', authRouter(db))
  app.use('/api/cards', cardsRouter(db))
  app.use('/api/uploads', uploadsRouter(db, uploadDir))

  // In production Express serves the Vite build
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(process.cwd(), 'dist')
    app.use(express.static(distDir))
    app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
  }

  // 404 for unmatched /api routes (must come after API routers)
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } })
  })

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
  })

  return app
}
```

Note: `cardsRouter` and `uploadsRouter` don't exist yet — add placeholder stubs so the file compiles:

```ts
// server/routes/cards.ts  (stub — replace in Task 5)
import { Router } from 'express'
import type { Db } from '../db'
export function cardsRouter(_db: Db) { return Router() }
```

```ts
// server/routes/uploads.ts  (stub — replace in Task 6)
import { Router } from 'express'
import type { Db } from '../db'
export function uploadsRouter(_db: Db, _uploadDir: string) { return Router() }
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test -- routes/auth.test.ts
```

Expected: PASS — 7 tests

- [ ] **Step 6: Commit**

```bash
git add server/routes/auth.ts server/routes/auth.test.ts server/routes/cards.ts server/routes/uploads.ts server/app.ts
git commit -m "feat: auth routes (register + login) with tests"
```

---

### Task 5: Cards Routes

**Files:**
- Modify: `server/routes/cards.ts` (replace stub)
- Create: `server/routes/cards.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// server/routes/cards.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import Database from 'better-sqlite3'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { initSchema } from '../db'
import { createApp } from '../app'

let db: InstanceType<typeof Database>
let app: ReturnType<typeof createApp>
let uploadDir: string
let tokenA: string
let tokenB: string

async function register(email: string, password = 'password123') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password })
  return res.body.token as string
}

beforeEach(async () => {
  uploadDir = mkdtempSync(join(tmpdir(), 'fc-test-'))
  db = new Database(':memory:')
  initSchema(db)
  app = createApp(db, uploadDir)
  tokenA = await register('alice@example.com')
  tokenB = await register('bob@example.com')
})

afterEach(() => {
  db.close()
  rmSync(uploadDir, { recursive: true, force: true })
})

describe('GET /api/cards', () => {
  it('returns an empty array when user has no cards', async () => {
    const res = await request(app)
      .get('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/cards')
    expect(res.status).toBe(401)
  })

  it("only returns the current user's own cards", async () => {
    // Alice creates a card
    await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Alice front', back_text: 'Alice back' })

    // Bob's list should be empty
    const res = await request(app)
      .get('/api/cards')
      .set('Authorization', `Bearer ${tokenB}`)
    expect(res.body).toEqual([])
  })
})

describe('POST /api/cards', () => {
  it('creates a card with text on both sides', async () => {
    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'What is 2+2?', back_text: '4' })
    expect(res.status).toBe(201)
    expect(res.body.front_text).toBe('What is 2+2?')
    expect(res.body.back_text).toBe('4')
    expect(res.body.id).toBeDefined()
  })

  it('creates a card with an image URL on front', async () => {
    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_image_url: 'https://example.com/img.jpg', back_text: 'A photo' })
    expect(res.status).toBe(201)
    expect(res.body.front_image_url).toBe('https://example.com/img.jpg')
  })

  it('returns 400 when front has neither text nor image', async () => {
    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ back_text: 'Back only' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when back has neither text nor image', async () => {
    const res = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Front only' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/cards')
      .send({ front_text: 'Q', back_text: 'A' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/cards/:id', () => {
  it('returns a card owned by the current user', async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Q', back_text: 'A' })

    const res = await request(app)
      .get(`/api/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(created.body.id)
  })

  it("returns 403 when accessing another user's card", async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Q', back_text: 'A' })

    const res = await request(app)
      .get(`/api/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
    expect(res.status).toBe(403)
  })

  it('returns 404 for a card that does not exist', async () => {
    const res = await request(app)
      .get('/api/cards/99999')
      .set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/cards/:id', () => {
  it('updates a card and returns the updated record', async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Old', back_text: 'Back' })

    const res = await request(app)
      .put(`/api/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'New', back_text: 'Back' })
    expect(res.status).toBe(200)
    expect(res.body.front_text).toBe('New')
  })

  it("returns 403 when updating another user's card", async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Q', back_text: 'A' })

    const res = await request(app)
      .put(`/api/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ front_text: 'Hacked', back_text: 'A' })
    expect(res.status).toBe(403)
  })

  it('returns 404 for a card that does not exist', async () => {
    const res = await request(app)
      .put('/api/cards/99999')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Q', back_text: 'A' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/cards/:id', () => {
  it('deletes a card and returns 204', async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Q', back_text: 'A' })

    const res = await request(app)
      .delete(`/api/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(204)

    // Verify it's gone
    const check = await request(app)
      .get(`/api/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
    expect(check.status).toBe(404)
  })

  it("returns 403 when deleting another user's card", async () => {
    const created = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ front_text: 'Q', back_text: 'A' })

    const res = await request(app)
      .delete(`/api/cards/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
    expect(res.status).toBe(403)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- routes/cards.test.ts
```

Expected: FAIL — routes return empty (stub router)

- [ ] **Step 3: Replace `server/routes/cards.ts` stub with full implementation**

```ts
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
      .all(req.userId)
    res.json(cards)
  })

  router.get('/:id', (req, res) => {
    const card = db
      .prepare('SELECT * FROM cards WHERE id = ?')
      .get(req.params.id) as Card | undefined

    if (!card) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } })
    }
    if (card.user_id !== req.userId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
    }
    return res.json(card)
  })

  router.post('/', (req, res) => {
    const parse = cardBodySchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parse.error.message },
      })
    }

    const { front_text, front_image_url, back_text, back_image_url } = parse.data
    const card = db
      .prepare(`
        INSERT INTO cards (user_id, front_text, front_image_url, back_text, back_image_url)
        VALUES (?, ?, ?, ?, ?)
        RETURNING *
      `)
      .get(
        req.userId,
        front_text ?? null,
        front_image_url ?? null,
        back_text ?? null,
        back_image_url ?? null
      ) as Card

    return res.status(201).json(card)
  })

  router.put('/:id', (req, res) => {
    const card = db
      .prepare('SELECT * FROM cards WHERE id = ?')
      .get(req.params.id) as Card | undefined

    if (!card) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Card not found' } })
    }
    if (card.user_id !== req.userId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
    }

    const parse = cardBodySchema.safeParse(req.body)
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: parse.error.message },
      })
    }

    const { front_text, front_image_url, back_text, back_image_url } = parse.data
    const updated = db
      .prepare(`
        UPDATE cards
        SET front_text = ?, front_image_url = ?, back_text = ?, back_image_url = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
        WHERE id = ?
        RETURNING *
      `)
      .get(
        front_text ?? null,
        front_image_url ?? null,
        back_text ?? null,
        back_image_url ?? null,
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
    if (card.user_id !== req.userId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
    }

    db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id)
    return res.status(204).send()
  })

  return router
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- routes/cards.test.ts
```

Expected: PASS — 14 tests

- [ ] **Step 5: Commit**

```bash
git add server/routes/cards.ts server/routes/cards.test.ts
git commit -m "feat: cards CRUD routes with ownership enforcement"
```

---

### Task 6: Uploads Route

**Files:**
- Modify: `server/routes/uploads.ts` (replace stub)
- Create: `server/routes/uploads.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// server/routes/uploads.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import Database from 'better-sqlite3'
import { mkdtempSync, rmSync, readdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { initSchema } from '../db'
import { createApp } from '../app'

let db: InstanceType<typeof Database>
let app: ReturnType<typeof createApp>
let uploadDir: string
let token: string

beforeEach(async () => {
  uploadDir = mkdtempSync(join(tmpdir(), 'fc-upload-test-'))
  db = new Database(':memory:')
  initSchema(db)
  app = createApp(db, uploadDir)
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'alice@example.com', password: 'password123' })
  token = res.body.token
})

afterEach(() => {
  db.close()
  rmSync(uploadDir, { recursive: true, force: true })
})

describe('POST /api/uploads', () => {
  it('uploads a JPEG and returns a URL', async () => {
    // A minimal valid 1x1 JPEG in binary
    const jpegBuffer = Buffer.from(
      'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffd9',
      'hex'
    )
    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', jpegBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' })

    expect(res.status).toBe(201)
    expect(res.body.url).toMatch(/^\/uploads\/.+\.jpg$/)

    // File should exist on disk
    const files = readdirSync(uploadDir)
    expect(files.length).toBe(1)
  })

  it('returns 400 for a non-image file type', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('not an image'), { filename: 'file.txt', contentType: 'text/plain' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE')
  })

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .attach('image', Buffer.from('data'), { filename: 'test.jpg', contentType: 'image/jpeg' })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- routes/uploads.test.ts
```

Expected: FAIL — stub router returns no response

- [ ] **Step 3: Replace `server/routes/uploads.ts` stub with full implementation**

```ts
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- routes/uploads.test.ts
```

Expected: PASS — 3 tests

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```

Expected: PASS — all tests across db, middleware, auth routes, cards routes, uploads routes

- [ ] **Step 6: Commit**

```bash
git add server/routes/uploads.ts server/routes/uploads.test.ts
git commit -m "feat: image upload route with file type + size validation"
```

---

### Task 7: Express Entry Point

**Files:**
- Create: `server/index.ts`

- [ ] **Step 1: Create `server/index.ts`**

```ts
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
```

- [ ] **Step 2: Smoke-test the server starts**

```bash
npx tsx server/index.ts
```

Expected: `Server running on http://localhost:3001` — then Ctrl+C to stop

- [ ] **Step 3: Commit**

```bash
git add server/index.ts
git commit -m "feat: Express entry point"
```

---

### Task 8: Frontend API Client

**Files:**
- Create: `src/api/client.ts`
- Create: `src/api/auth.ts`
- Create: `src/api/cards.ts`
- Create: `src/api/uploads.ts`

- [ ] **Step 1: Create `src/api/client.ts`**

```ts
// Base fetch wrapper — attaches the JWT from localStorage if present
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body?.error?.message ?? 'Request failed'), {
      code: body?.error?.code,
      status: res.status,
    })
  }

  // 204 No Content
  if (res.status === 204) return undefined as T
  return res.json()
}
```

- [ ] **Step 2: Create `src/api/auth.ts`**

```ts
import { apiFetch } from './client'

export interface AuthResponse {
  token: string
  user: { id: number; email: string; created_at: string }
}

export function register(email: string, password: string) {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}
```

- [ ] **Step 3: Create `src/api/cards.ts`**

```ts
import { apiFetch } from './client'

export interface Card {
  id: number
  user_id: number
  front_text: string | null
  front_image_url: string | null
  back_text: string | null
  back_image_url: string | null
  created_at: string
  updated_at: string
}

export interface CardBody {
  front_text?: string | null
  front_image_url?: string | null
  back_text?: string | null
  back_image_url?: string | null
}

export const getCards = () => apiFetch<Card[]>('/api/cards')

export const getCard = (id: number) => apiFetch<Card>(`/api/cards/${id}`)

export const createCard = (body: CardBody) =>
  apiFetch<Card>('/api/cards', { method: 'POST', body: JSON.stringify(body) })

export const updateCard = (id: number, body: CardBody) =>
  apiFetch<Card>(`/api/cards/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const deleteCard = (id: number) =>
  apiFetch<void>(`/api/cards/${id}`, { method: 'DELETE' })
```

- [ ] **Step 4: Create `src/api/uploads.ts`**

```ts
// Separate fetch for multipart — can't use the JSON wrapper here
export async function uploadImage(file: File): Promise<{ url: string }> {
  const token = localStorage.getItem('token')
  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body?.error?.message ?? 'Upload failed'), {
      code: body?.error?.code,
      status: res.status,
    })
  }
  return res.json()
}
```

- [ ] **Step 5: Commit**

```bash
git add src/api/
git commit -m "feat: frontend API client (auth, cards, uploads)"
```

---

### Task 9: React App Shell

**Files:**
- Create: `src/context/AuthContext.tsx`
- Create: `src/components/ProtectedRoute.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`

- [ ] **Step 1: Create `src/context/AuthContext.tsx`**

```tsx
import { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  id: number
  email: string
  created_at: string
}

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  function login(newToken: string, newUser: User) {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook so components don't import AuthContext directly
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Create `src/components/ProtectedRoute.tsx`**

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}
```

- [ ] **Step 3: Create `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { CardsPage } from './pages/CardsPage'

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/cards"
            element={
              <ProtectedRoute>
                <CardsPage />
              </ProtectedRoute>
            }
          />
          {/* Redirect root to /cards */}
          <Route path="*" element={<Navigate to="/cards" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

- [ ] **Step 4: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 5: Add placeholder page stubs** (so App.tsx compiles before pages are built)

```tsx
// src/pages/LoginPage.tsx
export function LoginPage() { return <div>Login</div> }
```

```tsx
// src/pages/RegisterPage.tsx
export function RegisterPage() { return <div>Register</div> }
```

```tsx
// src/pages/CardsPage.tsx
export function CardsPage() { return <div>Cards</div> }
```

- [ ] **Step 6: Verify Vite builds without TypeScript errors**

```bash
npx vite build
```

Expected: build succeeds, `dist/` created

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: React app shell — routing, AuthContext, ProtectedRoute"
```

---

### Task 10: Auth Pages (Login + Register)

**Files:**
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/pages/RegisterPage.tsx`

- [ ] **Step 1: Replace `src/pages/RegisterPage.tsx`**

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as authApi from '../api/auth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormValues) {
    try {
      const res = await authApi.register(data.email, data.password)
      login(res.token, res.user)
      navigate('/cards')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'EMAIL_TAKEN') {
        setError('email', { message: 'Email already registered' })
      } else {
        setError('root', { message: 'Registration failed. Please try again.' })
      }
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px' }}>
      <h1>Create account</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" {...register('email')} />
          {errors.email && <p role="alert">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" {...register('password')} />
          {errors.password && <p role="alert">{errors.password.message}</p>}
        </div>
        {errors.root && <p role="alert">{errors.root.message}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  )
}
```

- [ ] **Step 2: Replace `src/pages/LoginPage.tsx`**

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as authApi from '../api/auth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormValues) {
    try {
      const res = await authApi.login(data.email, data.password)
      login(res.token, res.user)
      navigate('/cards')
    } catch {
      setError('root', { message: 'Invalid email or password' })
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px' }}>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" {...register('email')} />
          {errors.email && <p role="alert">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" {...register('password')} />
          {errors.password && <p role="alert">{errors.password.message}</p>}
        </div>
        {errors.root && <p role="alert">{errors.root.message}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p>Don't have an account? <Link to="/register">Register</Link></p>
    </div>
  )
}
```

- [ ] **Step 3: Verify build still passes**

```bash
npx vite build
```

Expected: PASS — no TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/LoginPage.tsx src/pages/RegisterPage.tsx
git commit -m "feat: login and register pages with Zod validation"
```

---

### Task 11: Cards UI

**Files:**
- Modify: `src/pages/CardsPage.tsx`
- Create: `src/components/CardItem.tsx`
- Create: `src/components/CardForm.tsx`

- [ ] **Step 1: Create `src/components/CardItem.tsx`**

```tsx
import type { Card } from '../api/cards'

interface Props {
  card: Card
  onEdit: (card: Card) => void
  onDelete: (id: number) => void
}

export function CardItem({ card, onEdit, onDelete }: Props) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 12 }}>
      <div>
        <strong>Front</strong>
        <p>{card.front_text}</p>
        {card.front_image_url && (
          <img src={card.front_image_url} alt="Front" style={{ maxWidth: 200 }} />
        )}
      </div>
      <hr />
      <div>
        <strong>Back</strong>
        <p>{card.back_text}</p>
        {card.back_image_url && (
          <img src={card.back_image_url} alt="Back" style={{ maxWidth: 200 }} />
        )}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button onClick={() => onEdit(card)}>Edit</button>
        <button onClick={() => onDelete(card.id)}>Delete</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/CardForm.tsx`**

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import type { Card, CardBody } from '../api/cards'
import { uploadImage } from '../api/uploads'

// Mirror the server-side constraint: each side needs at least text or an image URL
const schema = z
  .object({
    front_text: z.string().max(10_000).optional(),
    front_image_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
    back_text: z.string().max(10_000).optional(),
    back_image_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  })
  .refine((d) => d.front_text || d.front_image_url, {
    message: 'Front needs text or an image',
    path: ['front_text'],
  })
  .refine((d) => d.back_text || d.back_image_url, {
    message: 'Back needs text or an image',
    path: ['back_text'],
  })

type FormValues = z.infer<typeof schema>

interface Props {
  initial?: Card
  onSave: (body: CardBody) => Promise<void>
  onCancel: () => void
}

export function CardForm({ initial, onSave, onCancel }: Props) {
  const [uploading, setUploading] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      front_text: initial?.front_text ?? '',
      front_image_url: initial?.front_image_url ?? '',
      back_text: initial?.back_text ?? '',
      back_image_url: initial?.back_image_url ?? '',
    },
  })

  async function handleFileUpload(field: 'front_image_url' | 'back_image_url', file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError(field, { message: 'File must be under 5 MB' })
      return
    }
    setUploading(true)
    try {
      const { url } = await uploadImage(file)
      setValue(field, url)
    } catch {
      setError(field, { message: 'Upload failed. Try again.' })
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(data: FormValues) {
    await onSave({
      front_text: data.front_text || null,
      front_image_url: data.front_image_url || null,
      back_text: data.back_text || null,
      back_image_url: data.back_image_url || null,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h3>{initial ? 'Edit card' : 'New card'}</h3>

      <fieldset>
        <legend>Front</legend>
        <label>Text</label>
        <textarea {...register('front_text')} rows={3} />
        {errors.front_text && <p role="alert">{errors.front_text.message}</p>}

        <label>Image URL</label>
        <input type="url" {...register('front_image_url')} placeholder="https://..." />
        <span> or </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload('front_image_url', file)
          }}
        />
        {errors.front_image_url && <p role="alert">{errors.front_image_url.message}</p>}
      </fieldset>

      <fieldset>
        <legend>Back</legend>
        <label>Text</label>
        <textarea {...register('back_text')} rows={3} />
        {errors.back_text && <p role="alert">{errors.back_text.message}</p>}

        <label>Image URL</label>
        <input type="url" {...register('back_image_url')} placeholder="https://..." />
        <span> or </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload('back_image_url', file)
          }}
        />
        {errors.back_image_url && <p role="alert">{errors.back_image_url.message}</p>}
      </fieldset>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Replace `src/pages/CardsPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as cardsApi from '../api/cards'
import type { Card, CardBody } from '../api/cards'
import { CardItem } from '../components/CardItem'
import { CardForm } from '../components/CardForm'

export function CardsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [cards, setCards] = useState<Card[]>([])
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cardsApi.getCards().then(setCards).catch(console.error)
  }, [])

  async function handleCreate(body: CardBody) {
    const card = await cardsApi.createCard(body)
    setCards((prev) => [card, ...prev])
    setShowForm(false)
  }

  async function handleUpdate(body: CardBody) {
    if (!editingCard) return
    const updated = await cardsApi.updateCard(editingCard.id, body)
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setEditingCard(null)
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this card?')) return
    await cardsApi.deleteCard(id)
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Cards</h1>
        <div>
          <span style={{ marginRight: 12 }}>{user?.email}</span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </div>

      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}

      {!showForm && !editingCard && (
        <button onClick={() => setShowForm(true)} style={{ marginBottom: 16 }}>
          + New card
        </button>
      )}

      {showForm && (
        <CardForm
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingCard && (
        <CardForm
          initial={editingCard}
          onSave={handleUpdate}
          onCancel={() => setEditingCard(null)}
        />
      )}

      {cards.length === 0 && !showForm && (
        <p>No cards yet. Create your first one!</p>
      )}

      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          onEdit={setEditingCard}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
npx vite build
```

Expected: PASS — no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/ src/pages/CardsPage.tsx
git commit -m "feat: cards UI — list, create, edit, delete"
```

---

### Task 12: Pre-commit Hooks

**Files:**
- Create: `.husky/pre-commit`

- [ ] **Step 1: Initialise Husky**

```bash
npx husky init
```

Expected: `.husky/pre-commit` created with default content

- [ ] **Step 2: Replace `.husky/pre-commit` with lint + test**

```bash
npm run lint && npm test
```

(The file should contain only those two lines — no shebang needed for Husky v9.)

- [ ] **Step 3: Verify the hook runs correctly**

```bash
git add .husky/
git commit -m "chore: pre-commit hook (lint + test)"
```

Expected: lint and tests run as part of the commit. If tests are green, commit succeeds.

---

### Task 13: Playwright E2E

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/flashcards.spec.ts`

- [ ] **Step 1: Install Playwright browsers**

```bash
npx playwright install chromium
```

Expected: Chromium downloaded

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  // Start Vite + Express before tests, shut them down after
  webServer: [
    {
      command: 'npx tsx server/index.ts',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npx vite',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
```

- [ ] **Step 3: Create `e2e/flashcards.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

// Use a unique email per test run so tests don't conflict
const email = `test-${Date.now()}@example.com`
const password = 'password123'

test.describe('Flashcard App', () => {
  test('register, create a card, edit it, then delete it', async ({ page }) => {
    // Register
    await page.goto('/register')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')

    // Should land on /cards
    await expect(page).toHaveURL('/cards')
    await expect(page.getByText('My Cards')).toBeVisible()

    // Create a card
    await page.click('button:has-text("+ New card")')
    await page.locator('fieldset:has(legend:text("Front")) textarea').fill('What is 2 + 2?')
    await page.locator('fieldset:has(legend:text("Back")) textarea').fill('4')
    await page.click('button[type="submit"]')

    // Card appears in list
    await expect(page.getByText('What is 2 + 2?')).toBeVisible()

    // Edit the card
    await page.click('button:has-text("Edit")')
    await page.locator('fieldset:has(legend:text("Front")) textarea').fill('What is 3 + 3?')
    await page.click('button[type="submit"]')
    await expect(page.getByText('What is 3 + 3?')).toBeVisible()

    // Delete the card
    page.on('dialog', (dialog) => dialog.accept())
    await page.click('button:has-text("Delete")')
    await expect(page.getByText('What is 3 + 3?')).not.toBeVisible()
    await expect(page.getByText('No cards yet')).toBeVisible()
  })

  test('login with existing account', async ({ page }) => {
    // Register first
    await page.goto('/register')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')
    await page.click('button:has-text("Log out")')

    // Now log in
    await page.goto('/login')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/cards')
  })

  test('shows error for wrong password on login', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'nobody@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.getByRole('alert')).toContainText('Invalid email or password')
  })

  test('redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/cards')
    await expect(page).toHaveURL('/login')
  })
})
```

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts e2e/
git commit -m "feat: Playwright E2E — register, create, edit, delete flow"
```

---

### Task 14: Final Verification

- [ ] **Step 1: Run the full unit + API test suite**

```bash
npm test
```

Expected: all tests PASS (db, middleware, auth routes, cards routes, uploads routes)

- [ ] **Step 2: Lint the entire codebase**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: Build for production**

```bash
npm run build
```

Expected: `dist/` created, no TypeScript errors

- [ ] **Step 4: Smoke-test production mode**

```bash
NODE_ENV=production npm start
```

Open `http://localhost:3001` — should serve the built React app. Register and log in. Then Ctrl+C.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: verified full build and test suite green"
```
