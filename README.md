# backoffice

Node.js + Express backoffice dashboard with:

- MySQL database connectivity through environment variables
- Repository layer (`server/repositories`)
- JWT auth, roles, and permissions (RBAC)
- Request and application logging (Pino)
- SQL migrations and seed scripts

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Create `.env` from `.env.example` and update DB credentials.

```bash
cp .env.example .env
```

## 3. Run DB migrations

```bash
npm run migrate
```

## 4. Seed roles/permissions/default admin

```bash
npm run seed
```

Default seeded admin credentials (from env defaults):

- Email: `admin@example.com`
- Password: `Admin@12345`

## 5. Start app

```bash
npm start
```

Open: `http://localhost:3001`

## API summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `GET /api/users` (permission: `users:read`)
- `PATCH /api/users/:id/roles` (permission: `users:assign-role`)
- `GET /api/access/roles` (permission: `roles:read`)
- `GET /api/access/permissions` (permission: `permissions:read`)

## Migration practice used

- SQL files are stored in `server/migrations/sql`
- `server/scripts/migrate.js` runs unapplied scripts in sorted order
- Applied migrations are tracked in `schema_migrations`

This is a common Express practice for SQL-first teams and works well for CI/CD.
