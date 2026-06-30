# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with nodemon (auto-reload)
npm start         # Start production server
npm run migrate   # Run unapplied SQL migrations
npm run seed      # Seed roles, permissions, and default admin user
```

Server runs on port `3001` by default (configurable via `PORT` env var).

## Setup

Copy `.env.example` to `.env` and fill in values, then:

```bash
npm run migrate   # Apply schema migrations
npm run seed      # Create default admin + roles/permissions
```

Default seeded admin: `admin@example.com` / `Admin@12345`

## Architecture

Full-stack Node.js/Express app with a vanilla JS SPA frontend.

**Backend layers (MVC + Repository pattern):**
- `server/routes/` — Express routers, thin; just wire middlewares and call controllers
- `server/controllers/` — Parse request, call service, return response
- `server/services/` — Business logic; orchestrate repository calls
- `server/repositories/` — Raw MySQL queries (mysql2/promise, no ORM); only layer that touches DB
- `server/middleware/` — `authenticate.js` (JWT Bearer), `authorizePermission.js` (RBAC), `errorHandler.js`, `requestLogger.js`
- `server/config/` — `db.js` (MySQL pool), `env.js` (validated env vars), `logger.js` (Pino)

**Database:**
- MySQL 2 with connection pooling
- Schema managed via SQL files in `server/migrations/sql/`, applied in sorted order and tracked in `schema_migrations` table
- No ORM; all queries use parameterized statements (mysql2 placeholders)

**Authentication & Authorization:**
- JWT-based; token returned on `/api/auth/login`, sent as `Authorization: Bearer <token>`
- Permissions are embedded in the JWT payload at login time to avoid per-request DB lookups
- `authorizePermission(permissionName)` middleware guards routes; RBAC roles: `admin`, `manager`, `user`

**Frontend (`public/`):**
- Vanilla JS SPA — `app.js` renders everything dynamically; no build step
- Auth token stored in `localStorage`
- Communicates with the Express backend via `fetch`

## API Surface

| Method | Path | Permission required |
|--------|------|-------------------|
| POST | `/api/auth/register` | — |
| POST | `/api/auth/login` | — |
| GET | `/api/auth/me` | authenticated |
| GET | `/api/users` | `users:read` |
| PATCH | `/api/users/:id/roles` | `users:assign-role` |
| GET | `/api/access/roles` | `roles:read` |
| GET | `/api/access/permissions` | `permissions:read` |
| GET | `/api/stats` | — |
| GET | `/api/activity` | — |
| GET | `/api/health` | — |

## Key Conventions

- **Migrations**: add new `.sql` files to `server/migrations/sql/` named with a numeric prefix (e.g. `002_add_column.sql`); never edit applied migrations
- **Error handling**: throw errors from services/repositories; `errorHandler` middleware catches and formats them — don't send error responses inline in controllers
- **Logging**: use the Pino logger from `server/config/logger.js`; structured JSON in production, pretty-printed in dev
- **Rate limiting**: global 300 req / 15 min per IP via express-rate-limit
