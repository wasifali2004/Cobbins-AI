# Cobbins AI

Cobbins AI is a searchable library of real web-app interface screens paired with
an AI workspace that turns selected references into editable React or HTML
pages. A user describes the page they want (optionally attaching a reference
image), the backend plans a section-by-section layout, retrieves the closest
matching component for each section from a pgvector-backed library, adapts it
to the request with an LLM, and returns a live-previewable, exportable page.

This repository is a monorepo managed with npm workspaces:

- **`frontend`** — Next.js 16 (App Router), TypeScript, Tailwind CSS v4,
  Framer Motion, Three.js, NextAuth (credentials + Google/GitHub OAuth).
- **`backend`** — NestJS 11 API, Prisma + Postgres (Supabase) with a pgvector
  `components` table for retrieval, JWT auth, Gemini for generation/embeddings
  with a Groq fallback, Supabase Storage for uploaded reference images, Resend
  for transactional email, and Polar for credit-pack checkout.
- **`component-library`** — the source-of-truth reference components (hero,
  navbar, button, pricing, testimonial, etc.) that get embedded and loaded
  into the retrieval database.

## Architecture at a glance

```
frontend (Next.js, :3100)  ──▶  backend (NestJS, :4000/api)  ──▶  Postgres (Supabase, pgvector)
                                        │                      ──▶  Supabase Storage (reference images)
                                        ├──▶ Gemini (plan / adapt / embed / vision)
                                        ├──▶ Groq (fallback text/JSON generation)
                                        ├──▶ Resend (password reset email)
                                        └──▶ Polar (credit-pack checkout)
```

## Prerequisites

- Node.js 20+
- A Supabase project (Postgres with the `pgvector` extension enabled, plus a
  Storage bucket) — see `backend/prisma/schema.prisma` for the schema.
- API keys for whichever of Gemini / Groq / Resend / Polar you want enabled
  locally (Groq, Resend, and Polar are optional; the app degrades gracefully
  without them).

## Setup

```bash
npm install

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# fill in the real values in both files — see the comments in each for what's required

npm run dev
```

This starts both apps concurrently:

- Frontend: `http://localhost:3100`
- Backend API: `http://localhost:4000/api`

Run them individually with `npm run dev:frontend` / `npm run dev:backend`.

### Database

The `components` table's `embedding` column is a raw pgvector `vector(1536)`
with an ivfflat cosine index created directly in Supabase — **do not** run
`prisma db push` or `prisma migrate` against it, as Prisma doesn't model
`vector` natively. Apply new schema changes as hand-written SQL instead.

To (re)populate the retrieval library from `component-library/`:

```bash
npm run seed:components
```

## Other scripts

- `npm run build` — build both apps
- `npm run typecheck` — typecheck both apps
- `npm run qa` — Playwright-driven QA pass (see `scripts/`)

## Key routes

**Frontend**
- `/` — landing page
- `/login`, `/signup`, `/forgot-password`, `/reset-password`
- `/dashboard` — generation workspace, library, settings
- `/generate/:id` — generated-page result view

**Backend** (all under `/api`)
- `POST /auth/signup`, `POST /auth/login`, `POST /auth/oauth-login`
- `POST /auth/forgot-password`, `POST /auth/reset-password`
- `GET /auth/me`, `GET /auth/profile`, `PATCH /profile`
- `POST /plan` — section plan for a prompt
- `POST /retrieve` — nearest component match for a section category
- `POST /generate` — full page generation (plan → retrieve → adapt per section)
- `GET /export/:id` — download a generated page as a zip
- `GET /credits` — remaining generation credits
- `GET /health`
