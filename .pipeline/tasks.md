# Pipeline Task Decomposition

## Summary
"FaithfulF Recipe Box" is a greenfield monorepo pairing a NestJS + Prisma/PostgreSQL API with an Angular 17+ standalone SPA. It provides JWT email/password authentication, per-user Recipe CRUD (title, ingredients, steps) scoped to the owning user, and an admin-only overview reporting recipe counts per user. Backing services are provisioned via docker-compose (postgres) with MinIO available, and the app carries "FaithfulF Recipe Box" branding in title and header.

## Surface contract
Backend REST routes (all under global `/api` prefix):
- `POST /api/auth/register` — public; creates USER.
- `POST /api/auth/login` — public; returns JWT `{sub, email, role}`.
- `GET /api/recipes` — auth; list caller's recipes.
- `POST /api/recipes` — auth; create recipe for caller.
- `GET /api/recipes/:id` — auth; owner-scoped, 404 if not owned.
- `PATCH /api/recipes/:id` — auth; owner-scoped, 404 if not owned.
- `DELETE /api/recipes/:id` — auth; owner-scoped, 404 if not owned.
- `GET /api/admin/overview` — auth + RolesGuard('ADMIN'); `[{ email, recipeCount }]`; 403 for non-admin.
- `GET /api/admin/settings` — auth + admin; list service/credential keys with masked values + configured status.
- `PATCH /api/admin/settings` — auth + admin; upsert key-value settings.
- `GET /api/health` — public liveness.
- `GET /api/health/deep` — public; Prisma `SELECT 1`.

Frontend routes/screens:
- `/login` — public.
- `/signup` — public.
- `/recipes` — authGuard; list, items carry `data-testid="recipe-item"`; delete confirm as `?modal=delete&id=`.
- `/recipes/new` — authGuard; create form.
- `/recipes/:id/edit` — authGuard; edit form.
- `/admin` — adminGuard; table `data-testid="admin-overview"`.
- `/admin/settings` — adminGuard; service/credential settings page.
- `''` → redirect `/recipes`; `**` → redirect.

Entities:
- `User` (id, email unique, passwordHash, role enum, createdAt).
- `Recipe` (id, title, ingredients text, steps text, userId FK, timestamps).
- `SystemSetting` (key, value, updatedAt).

## db_agent tasks
- [ ] Create `backend/prisma/schema.prisma` with PostgreSQL datasource and Prisma client generator.
- [ ] Define `enum UserRole { ADMIN USER }` and `User` model: `id`, `email @unique`, `passwordHash`, `role UserRole @default(USER)`, `createdAt`.
- [ ] Define `Recipe` model: `id`, `title`, `ingredients` (text), `steps` (text), `userId` FK → User, `createdAt`/`updatedAt`; relation back to User.
- [ ] Define `SystemSetting` model: `key String @id`, `value String`, `updatedAt DateTime @updatedAt`.
- [ ] Generate the initial Prisma migration for User/Recipe/SystemSetting.
- [ ] Write `backend/prisma/seed.ts` — create a demo `USER` and a demo `ADMIN` with bcrypt-hashed passwords; print `SEED_CREDS_JSON={...}` to stdout; wire `prisma db seed` in `package.json`.

## backend_agent tasks
- [ ] Create NestJS project config: `backend/package.json`, `tsconfig.json`, `nest-cli.json` with all listed dependencies.
- [ ] Implement `src/main.ts` — bootstrap, global `/api` prefix, CORS for frontend origin, global `ValidationPipe`; read `PORT`, `JWT_SECRET`, `DATABASE_URL` from env.
- [ ] Implement `src/prisma/prisma.service.ts` + `prisma.module.ts` (Prisma client provider) and wire modules in `src/app.module.ts`.
- [ ] Implement `src/auth/` — `auth.service.ts` (register with bcrypt hash, login verify + sign JWT `{sub, email, role}`), `auth.controller.ts` (`POST /api/auth/register`, `POST /api/auth/login`), register/login DTOs with class-validator. Public signup path creates USER (see Open questions re: full_auth first-user-admin rule).
- [ ] Implement `src/auth/jwt.strategy.ts` (passport-jwt), `jwt-auth.guard.ts`, `roles.guard.ts` + `@Roles()` decorator.
- [ ] Implement `src/recipes/` — `recipes.module.ts`, `recipes.service.ts`, `recipes.controller.ts` (`GET/POST /api/recipes`, `GET/PATCH/DELETE /api/recipes/:id`); all `@UseGuards(JwtAuthGuard)`; queries scoped to `req.user.sub`; 404 on non-owned `:id`; create/update DTOs (title/ingredients/steps).
- [ ] Implement `src/admin/` — `admin.module.ts`, `admin.controller.ts` (`GET /api/admin/overview`, guarded by JwtAuthGuard + RolesGuard('ADMIN')), `admin.service.ts` returning `[{ email, recipeCount }]` via Prisma groupBy/count.
- [ ] Implement `src/health/health.controller.ts` — `GET /api/health` (liveness) and `GET /api/health/deep` (Prisma `SELECT 1`); both public.
- [ ] Implement `lib/config.ts` with `resolveConfig(key)` — reads `process.env[key]`; if value equals `PLACEHOLDER_CONFIGURE_IN_SETTINGS` or absent, falls back to `SystemSetting` DB row; returns null if neither set.
- [ ] Implement `GET /api/admin/settings` (list service keys — postgresql, minio — with masked values + configured status) and `PATCH /api/admin/settings` (upsert key-value pairs, admin role required).
- [ ] Author `backend/.env` / `.env.example` (`DATABASE_URL`, `JWT_SECRET`, `PORT=3000`) and `backend/Dockerfile` (multi-stage; entrypoint runs `prisma migrate deploy` + `prisma db seed` then `node dist/main`).

## ui_agent tasks
- [ ] Scaffold Angular 17+ workspace: `frontend/package.json`, `angular.json`, `tsconfig*.json`, `environments/environment*.ts` (API base URL).
- [ ] `src/index.html` with `<title>FaithfulF Recipe Box</title>`; `src/app/app.component.*` header with "FaithfulF Recipe Box" branding + logout button; admin nav links visible only to ADMIN.
- [ ] Define `src/app/app.routes.ts` — `/login`, `/signup` (public), `/recipes`, `/recipes/new`, `/recipes/:id/edit` (authGuard), `/admin`, `/admin/settings` (adminGuard), `''`→`/recipes`, `**`→redirect.
- [ ] `login` and `signup` feature components wired to auth service (part of main app).
- [ ] `recipe-list` component — renders items with `data-testid="recipe-item"`; delete confirmation via `?modal=delete&id=` deep-linkable modal on the list route.
- [ ] `recipe-form` component — shared create/edit form for title/ingredients/steps with empty/loading/error states.
- [ ] `admin-overview` component — table with `data-testid="admin-overview"` showing per-user recipe counts.
- [ ] `/admin/settings` page — list each service in deployments (postgresql, minio) with configured/unconfigured badge + per-service credential form; wire to admin settings API.

## service_agent tasks
- [ ] `src/app/core/auth.service.ts` — register/login, store JWT in `localStorage`, expose current role/auth state.
- [ ] `src/app/core/auth.interceptor.ts` — attach `Authorization: Bearer <token>` to API requests.
- [ ] `src/app/core/auth.guard.ts` (authenticated) and `admin.guard.ts` (role ADMIN).
- [ ] `src/app/core/recipe.service.ts` — HTTP client for `GET/POST/GET/PATCH/DELETE /api/recipes` endpoints.
- [ ] `src/app/core/admin.service.ts` — HTTP client for `GET /api/admin/overview` and admin settings `GET/PATCH /api/admin/settings`.

## tester tasks
- [ ] Auth 401: `GET /api/recipes` with no token → 401.
- [ ] CRUD happy path: register/login → create "Banitsa" → `GET /api/recipes` returns it; UI shows `data-testid="recipe-item"`.
- [ ] Ownership isolation: second user cannot GET/PATCH/DELETE first user's recipe (404).
- [ ] Admin 403: non-admin `GET /api/admin/overview` → 403.
- [ ] Admin 200: seeded admin login → `/admin` renders `data-testid="admin-overview"` with per-user counts.
- [ ] Health: `GET /api/health` → 200; `GET /api/health/deep` → 200 with DB reachable.
- [ ] Branding: page title and header contain "FaithfulF".
- [ ] Admin settings: admin can load `/admin/settings`, non-admin blocked; `PATCH /api/admin/settings` upserts and `GET` reflects masked configured status.

## Open questions
- Auth model conflict: the pipeline `full_auth` rule states the first signup user should receive `ADMIN` and subsequent users `USER`, but the spec explicitly assumes public signup always creates `USER` with the admin seeded via `prisma/seed.ts`. Tasks follow the spec's seeded-admin approach — confirm this override is acceptable rather than first-user-admin.
- MinIO is provisioned as a backing service but the spec defines no object-storage behaviour (no uploads/attachments on Recipe). Its credential fields are surfaced on `/admin/settings`, but downstream usage is undefined — confirm whether recipe image/file storage is intended.
- No `## Integrations` were declared, so no third-party integration client modules were scoped. Confirm none are needed.
- Spec does not specify masking format or which exact credential keys (e.g. `DATABASE_URL`, MinIO access/secret keys) should appear on the settings page — downstream agents should derive from provisioned env vars.
