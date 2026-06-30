# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Next.js on port 3000)
npm run build     # Build for production
npm start         # Start production server
npm run migrate   # Run unapplied SQL migrations
npm run seed      # Seed roles, permissions, and default admin user
```

## Setup

Copy `.env.example` to `.env.local` and fill in values, then:

```bash
npm install
npm run migrate   # Apply schema migrations
npm run seed      # Create default admin + roles/permissions
npm run dev       # Start dev server
```

Default seeded admin: `admin@example.com` / `Admin@12345`

## Deployment (Hostinger Node.js)

```bash
npm install
npm run build     # Compile TypeScript + build Next.js
npm start         # next start — reads PORT env var set by Hostinger
```

## Architecture

Full-stack **Next.js 15** app (App Router) with TypeScript. Single application — backend and frontend together.

**Backend layers (same MVC + Repository pattern, now in `src/`):**
- `src/app/api/` — Next.js Route Handlers (replaces Express routes)
- `src/services/` — Business logic; orchestrate repository calls
- `src/repositories/` — Raw MySQL queries (mysql2/promise); only layer that touches DB
- `src/lib/` — Shared utilities: `db.ts` (MySQL pool singleton), `jwt.ts` (jose), `api-helpers.ts` (withAuth/withPermission wrappers), `logger.ts` (Pino)

**Frontend (Next.js App Router):**
- `src/app/(auth)/` — Public auth pages (login)
- `src/app/(dashboard)/` — Protected dashboard pages (layout verifies JWT cookie)
- `src/components/` — Shared React components (Sidebar etc.)
- `src/middleware.ts` — Edge middleware: redirects unauthenticated requests to `/login`

**Database:**
- MySQL 2 with connection pooling
- Schema managed via SQL files in `migrations/sql/`, applied in sorted order tracked in `schema_migrations` table
- No ORM; all queries use parameterized statements

**Authentication & Authorization:**
- JWT via `jose` (Edge + Node.js compatible)
- Token stored in **httpOnly cookie** (`auth_token`) — also returned in login response body for API clients
- `withAuth` / `withPermission` wrappers guard API route handlers
- RBAC roles: `admin`, `manager`, `user`; permissions embedded in JWT

## Directory Structure

```
src/
├── app/
│   ├── (auth)/login/     — /login page
│   ├── (dashboard)/      — protected pages (/, /users, /access)
│   ├── api/              — API route handlers
│   ├── layout.tsx        — root layout
│   └── globals.css
├── components/           — Sidebar, shared UI
├── lib/                  — db, jwt, api-helpers, logger
├── repositories/         — userRepository, roleRepository, permissionRepository
├── services/             — authService, userService
├── types/index.ts        — shared TypeScript interfaces
└── middleware.ts         — route protection
migrations/sql/           — SQL migration files
scripts/                  — migrate.ts, seed.ts
```

## API Surface

| Method | Path | Permission required |
|--------|------|-------------------|
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

## Key Conventions

- **Migrations**: add new `.sql` files to `migrations/sql/` named with a numeric prefix (e.g. `002_add_column.sql`); never edit applied migrations
- **Error handling**: throw errors from services/repositories with a `statusCode` property; `handleError()` in `api-helpers.ts` formats them — don't send error responses inline
- **Auth in route handlers**: wrap handlers with `withAuth(handler)` or `withPermission('perm:name', handler)`
- **Logging**: use the Pino logger from `src/lib/logger.ts`; server-side only
- **No Edge runtime in API routes**: API routes and server components run on Node.js runtime (mysql2, bcrypt, pino all work)
- **Middleware runs on Edge**: only `jose` (Web Crypto) is used there — no Node.js-only imports
