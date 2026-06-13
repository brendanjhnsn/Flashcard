# Flashcard App — Scaffold Design

**Date:** 2026-06-13
**Status:** Approved

---

## Overview

A multi-user flashcard app. Users register and log in, then create, edit, and delete their own flashcards. Each card has a front and back; both sides support text and/or image (local upload or external URL).

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

## Architecture

**Structure:** Integrated single package — Vite + React in `src/`, Express in `server/`. In development, Vite dev server (`:5173`) proxies `/api` and `/uploads` to Express (`:3001`). In production, Express serves the Vite build from `dist/`.

```
Flashcard/
├── src/                   ← React app (Vite root)
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/               ← fetch helpers (auth, cards, uploads)
│   ├── components/        ← shared UI components
│   └── pages/
│       ├── LoginPage.tsx
│       ├── RegisterPage.tsx
│       └── CardsPage.tsx
├── server/
│   ├── index.ts           ← Express entry point
│   ├── db.ts              ← SQLite setup (better-sqlite3)
│   ├── routes/
│   │   ├── auth.ts        ← register + login
│   │   ├── cards.ts       ← CRUD
│   │   └── uploads.ts     ← image upload
│   ├── middleware/
│   │   └── auth.ts        ← JWT verify middleware
│   └── uploads/           ← image files on disk (gitignored)
├── e2e/                   ← Playwright tests
├── vite.config.ts
├── package.json
├── .gitignore
└── CLAUDE.md
```

---

## Data Model

Two SQLite tables managed with `better-sqlite3`. Schema applied at server startup.

### `users`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | PK, autoincrement |
| email | TEXT | UNIQUE, NOT NULL |
| password_hash | TEXT | bcrypt, NOT NULL |
| created_at | TEXT | ISO 8601 |

### `cards`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | PK, autoincrement |
| user_id | INTEGER | FK → users.id, CASCADE DELETE |
| front_text | TEXT | nullable |
| front_image_url | TEXT | nullable — `/uploads/<uuid>.ext` or external URL |
| back_text | TEXT | nullable |
| back_image_url | TEXT | nullable — `/uploads/<uuid>.ext` or external URL |
| created_at | TEXT | ISO 8601 |
| updated_at | TEXT | ISO 8601 |

**Constraint (enforced by Zod, not DB):** Each side (front and back) must have at least one of `text` or `image_url` set.

Image URLs accept both local paths (`/uploads/uuid.jpg`) and valid external `https://` URLs. The client renders them the same way.

---

## API

All routes are under `/api`. Card and upload routes require `Authorization: Bearer <token>`.

### Auth (no auth required)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ email, password }` | `{ token, user: { id, email } }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user: { id, email } }` |

JWT is stored in `localStorage`, expires in 7 days.

### Cards (🔒 JWT required)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/cards` | — | `Card[]` |
| GET | `/api/cards/:id` | — | `Card` or 404 |
| POST | `/api/cards` | `{ front_text?, front_image_url?, back_text?, back_image_url? }` | `Card` (201) |
| PUT | `/api/cards/:id` | same shape as POST | `Card` or 404 |
| DELETE | `/api/cards/:id` | — | 204 or 404 |

Users may only access their own cards — accessing another user's card returns 403.

### Uploads (🔒 JWT required)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/uploads` | `multipart/form-data`, field: `image` | `{ url: "/uploads/<uuid>.jpg" }` |

Accepts JPEG, PNG, WebP. Max 5 MB. Client uploads the image first, receives the URL, then includes that URL in the card create/update body.

### Error Format

All errors return `{ error: { code, message } }`:
- `400` — validation failure (includes Zod field errors)
- `401` — missing or invalid JWT
- `403` — accessing another user's resource
- `404` — route or resource not found
- `500` — internal error (logged server-side, generic message to client)

---

## Frontend

Three pages, client-side routing via React Router:

| Page | Route | Description |
|---|---|---|
| Register | `/register` | Email + password form, redirects to `/cards` on success |
| Login | `/login` | Email + password form, redirects to `/cards` on success |
| Cards | `/cards` | List of user's cards with create / edit / delete actions |

**Form validation:** React Hook Form + Zod resolver. Same schemas mirror server-side rules (required fields, URL format, 5 MB file size limit enforced before upload).

Unauthenticated users are redirected to `/login`. JWT stored in `localStorage`; cleared on logout.

---

## Testing

### Unit Tests — Vitest
- Zod schema validation edge cases
- Auth helpers (token sign/verify)
- Co-located as `*.test.ts` next to the file under test

### API Integration Tests — Vitest + Supertest
- Every route: happy path + key error paths (401, 403, 404, 400 validation)
- Located in `server/routes/*.test.ts`
- Fresh in-memory SQLite DB per test file

### E2E — Playwright
- Covers: register → login → create card → edit card → delete card
- Located in `e2e/`
- Run via `npm run e2e` (CI only, not pre-commit)

---

## Scripts

| Script | Action |
|---|---|
| `npm run dev` | Vite `:5173` + Express `:3001` via `concurrently` |
| `npm run build` | Vite build → `dist/` |
| `npm start` | Express serves `dist/` (production) |
| `npm test` | Vitest (unit + API) |
| `npm run lint` | ESLint across `src/` + `server/` |
| `npm run e2e` | Playwright |

**Pre-commit (Husky + lint-staged):** runs `lint` then `test`. Blocks on failure.

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `vite`, `@vitejs/plugin-react` | Frontend build + HMR |
| `react`, `react-dom`, `react-router-dom` | UI + routing |
| `react-hook-form`, `@hookform/resolvers` | Form state + Zod integration |
| `express` | API server |
| `better-sqlite3` | SQLite driver (sync API, no callback mess) |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT sign/verify |
| `multer` | Multipart file upload handling |
| `zod` | Schema validation (shared between routes and frontend) |
| `uuid` | Unique filenames for uploads |
| `concurrently` | Run Vite + Express together in dev |
| `vitest`, `supertest` | Testing |
| `playwright` | E2E |
| `husky`, `lint-staged` | Pre-commit hooks |
| `eslint` | Linting |
