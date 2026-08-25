# Smart Screener AI

<p align="center">
  <em>AI-powered resume screening, done right.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js%2016-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React%2019-61dafb?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-2d3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" />
</p>

**Smart Screener AI** screens PDF resumes against a target job requisition. Upload a batch, and the server extracts text, scores every candidate with a constrained LLM plus rule-based analyzers, and streams a ranked shortlist back to the dashboard.

## Features

- **Bulk screening** — drop a folder of PDFs and get a ranked shortlist in seconds
- **Explainable scores** — every 0–100 score breaks down by skills, experience, resume quality, and fit
- **Strict honesty** — the LLM only credits skills explicitly written on the resume
- **Decision tiers** — `top` / `qualified` / `maybe` / `unqualified` / `rejected`
- **Private by design** — provider keys live on the server, never in the browser

## Architecture

| Layer | Path | Responsibility |
|---|---|---|
| UI | `app/page.tsx`, `components/ats/` | Job CRUD, PDF upload, live progress, ranking, candidate detail |
| Server actions | `src/actions/ats-review.ts` | Queue resumes, run scoring in `after()`, poll progress |
| Session | `lib/ats-session.ts` | In-memory `Map` for the in-flight batch |
| Engine adapter | `lib/ats-engine.ts` | Server LLM config + per-resume quota |
| Scoring engine | `src/ats-engine/` | Extract → analyze → validate → weighted score → decision band |
| Persistence | `src/repositories/candidate.repository.ts` | Candidate, application, and parsed-resume writes |
| Database | `prisma/schema.prisma` | `Job`, `Candidate`, `ParsedResume`, `Application` |

Credentials never leave the server. Provider keys are configured in `.env` (see `.env.example`).

### Request flow

1. Recruiter picks a job, attaches PDFs (or uses local `data/generated-resumes`).
2. `startAtsReview` peeks the IP quota, creates a session, then `after()` scores every resume in parallel.
3. Each resume: extract text → rule analyzers → LLM JSON → verify claimed skills → weighted 0–100 score.
4. The result is mapped to a UI tier. Postgres stores the **application** (score for that job) and a **parsed resume** (extracted text, keyed by SHA-256 of the file bytes). Writes fall back in-memory if the DB is down.
5. The client polls `getAtsReviewProgress` every 800ms, then loads the ranked roster.

### Scoring (screening defaults)

| Component | Weight |
|---|---|
| Skills | 30% |
| Experience | 20% |
| Resume quality | 20% |
| Domain / keyword | 10% |
| Semantic (LLM) | 10% |
| Education | 10% |

Penalties cap at 30 points (missing must-have skills, experience gap, seniority mismatch, poor ATS format). Decision bands: **≥85** strong · **≥70** good · **≥55** moderate · else no match. UI tiers: `top` / `qualified` / `maybe` / `unqualified` / `rejected`.

Rate limits (production, per IP): 10 / 10 min, 30 / hour, 80 / day. Concurrency 1; 400ms minimum between inferences.

## Local setup

Node 20+, pnpm 10+, PostgreSQL. Prisma talks to Postgres through the `pg` adapter (`lib/prisma.ts`). Neon works with the same `DATABASE_URL`.

```bash
pnpm install
cp .env.example .env
npx prisma generate
npx prisma db push
npx prisma db seed
pnpm dev
```

Open http://localhost:3000.

Required env: `DATABASE_URL` and the primary key in `.env.example`. Optional model and fallback keys are documented there.

### Neon

Paste the Neon connection string into `DATABASE_URL` (direct or pooled). Include `sslmode=require`. Then:

```bash
npx prisma db push
npx prisma db seed
```

The `pg` pool enables TLS automatically for `*.neon.tech` and any URL with `sslmode=require`.

Demo PDFs are gitignored. To use "existing resumes" locally, clone them into `data/generated-resumes/`.

```bash
pnpm verify:db   # connectivity check
pnpm studio      # Prisma Studio
```

### Deploy

Import the repo on Vercel (Next.js). Set `DATABASE_URL` and the server AI key from `.env.example`. `postinstall` / `build` already run `prisma generate`.
