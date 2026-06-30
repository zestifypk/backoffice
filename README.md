# Backoffice

Full-stack admin dashboard built with **Next.js 15** (App Router), **TypeScript**, **MySQL**, and **Tailwind CSS**. Backend and frontend live in a single application — no separate API server needed.

## Features

- JWT authentication with httpOnly cookies (RBAC: admin / manager / user)
- MySQL via `mysql2` — no ORM, raw parameterized queries
- Repository → Service → API Route layered architecture
- Route protection via Next.js Edge Middleware
- SQL migrations with applied-migration tracking
- Pino structured logging

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your DB credentials and JWT secret

# 3. Apply database migrations
npm run migrate

# 4. Seed roles, permissions, and default admin
npm run seed

# 5. Start dev server
npm run dev
```

Open: `http://localhost:3000`

Default admin: `admin@example.com` / `Admin@12345`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript and build for production |
| `npm start` | Start production server |
| `npm run migrate` | Run unapplied SQL migrations |
| `npm run seed` | Seed roles, permissions, and default admin |

## Project structure

```
src/
├── app/
│   ├── (auth)/login/       # /login  — public
│   ├── (dashboard)/        # /, /users, /access  — protected
│   ├── api/                # REST API route handlers
│   └── globals.css
├── components/             # Sidebar and shared UI
├── lib/                    # db, jwt, api-helpers, logger
├── repositories/           # MySQL query layer
├── services/               # Business logic
├── types/                  # Shared TypeScript interfaces
└── middleware.ts            # Edge middleware — auth guard
migrations/sql/             # SQL migration files (sorted, tracked)
scripts/                    # migrate.ts, seed.ts
```

## API

| Method | Path | Auth required |
|---|---|---|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| POST | `/api/auth/logout` | — |
| GET | `/api/auth/me` | authenticated |
| GET | `/api/users` | `users:read` |
| PATCH | `/api/users/:id/roles` | `users:assign-role` |
| GET | `/api/access/roles` | `roles:read` |
| GET | `/api/access/permissions` | `permissions:read` |
| GET | `/api/stats` | — |
| GET | `/api/activity` | — |
| GET | `/api/health` | — |

## Deployment (Hostinger Node.js)

Set all variables from `.env.example` in Hostinger's environment panel, then:

```bash
npm install
npm run build
npm start        # next start — reads PORT automatically
```

> Do not set `NODE_ENV` in the hosting panel — Next.js manages it automatically.

## Database migrations

SQL files live in `migrations/sql/` and are named with a numeric prefix (e.g. `001_init.sql`, `002_add_column.sql`). `npm run migrate` applies them in sorted order and tracks applied files in the `schema_migrations` table. Never edit an already-applied migration — add a new file instead.
