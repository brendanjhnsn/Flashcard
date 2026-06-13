# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Full-stack flashcard app: React front end, Express + SQLite back end.

## Coding Guidelines

- **Test-first (TDD).** Tests come first, always. Spend edge-case depth on high-impact paths (core logic, API contracts, user flows); keep trivial tests minimal.
- **Validate frontend inputs.** Required fields, types, length limits, basic format checks.
- **Write for a junior-to-mid dev.** Clear and conventional over clever.
- **Why-comments** (optional). Short explanations where they help a beginner.

## Conventions

| Concern | Approach |
|---|---|
| Validation | Zod at the API route boundary |
| Tests | Vitest; API routes via Supertest on an in-memory SQLite DB |
| E2E | Playwright, in `/e2e` (CI, not pre-commit) |
| Errors | Return `{ error: { code, message } }`; 404 for unknown routes/resources; log internals, never send them |
| Pre-commit | Runs lint + unit + API tests — never bypass with `--no-verify` |
| Deploy | Target + prod env vars — TBD |

## Plans

Every `write-plan` output must restate the Coding Guidelines and Conventions above in a "Constraints" section — `execute-plan` subagents read the plan, not this file.
