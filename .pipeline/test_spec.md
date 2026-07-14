# Test Specification

> ⚠️ **Warning: `.pipeline/surface.json` was not found.** The API surface below was
> derived from the `## Surface contract` section of `.pipeline/tasks.md` and the
> approved spec. If an upstream agent later emits `surface.json`, re-run this spec
> to reconcile any drift.

## Coverage summary
- Total cases: 61
- API endpoints covered: 12 / 12 (from `tasks.md` surface contract; `surface.json` absent)
- User journeys covered: 11

Endpoints under test (12):
`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/recipes`, `POST /api/recipes`,
`GET /api/recipes/:id`, `PATCH /api/recipes/:id`, `DELETE /api/recipes/:id`,
`GET /api/admin/overview`, `GET /api/admin/settings`, `PATCH /api/admin/settings`,
`GET /api/health`, `GET /api/health/deep`.

Conventions used below:
- **AUTH_USER** = JWT obtained by logging in as the seeded/registered `USER`.
- **AUTH_ADMIN** = JWT for the seeded `ADMIN`.
- Seed credentials are read from the backend's `SEED_CREDS_JSON={...}` stdout line.
- All backend routes live under the global `/api` prefix.

## API tests

### `POST /api/auth/register`
- **Happy path**: body `{ "email": "new@example.com", "password": "Passw0rd!" }` → `201` (or `200`); response contains a JWT string and/or the created user with `role: "USER"`; no `passwordHash` field leaked. A subsequent login with the same credentials succeeds.
- **Validation failures**:
  - Missing `email` → `400`.
  - Malformed `email` (`"not-an-email"`) → `400`.
  - Missing/empty `password` → `400`.
  - Empty body `{}` → `400`.
- **Auth failures**: n/a (public route).
- **Idempotency / edge cases**:
  - Duplicate email (register the same address twice) → `409` (or `400`); no second `User` row created.
  - Registered user always gets `role: "USER"` — a `role: "ADMIN"` field in the request body is ignored (privilege-escalation guard).

### `POST /api/auth/login`
- **Happy path**: valid seeded USER credentials → `200`; body contains a JWT whose decoded payload has `{ sub, email, role }`. Same for ADMIN credentials, with `role: "ADMIN"`.
- **Validation failures**:
  - Missing `email` or `password` → `400`.
  - Malformed `email` → `400`.
- **Auth failures**:
  - Correct email, wrong password → `401`.
  - Unknown email → `401` (message must not distinguish "no such user" from "bad password").
- **Idempotency / edge cases**: token issued encodes `role` from the DB, not from the request.

### `GET /api/recipes`
- **Happy path**: with AUTH_USER after creating "Banitsa" → `200`; body is a JSON array containing the recipe (`title: "Banitsa"`); only the caller's recipes are returned.
- **Validation failures**: n/a.
- **Auth failures**:
  - No `Authorization` header → `401`.
  - Malformed / expired / wrong-signature token → `401`.
- **Idempotency / edge cases**: a freshly registered user with no recipes → `200` with `[]`.

### `POST /api/recipes`
- **Happy path**: AUTH_USER, body `{ "title": "Banitsa", "ingredients": "filo, feta, eggs", "steps": "layer; bake" }` → `201`; response echoes the created recipe with a generated `id`, `userId` = caller, and timestamps.
- **Validation failures** (each → `400`):
  - Missing `title`.
  - Missing `ingredients`.
  - Missing `steps`.
  - Empty-string values for required fields.
  - Empty body `{}`.
- **Auth failures**: no/invalid token → `401`.
- **Idempotency / edge cases**: `userId` is taken from `req.user.sub`; a `userId` supplied in the body is ignored (recipe still owned by the caller).

### `GET /api/recipes/:id`
- **Happy path**: AUTH_USER requesting the id of a recipe they own → `200` with the recipe body.
- **Validation failures**: non-existent id → `404`.
- **Auth failures**: no/invalid token → `401`.
- **Idempotency / edge cases** (ownership): AUTH_USER_B requesting AUTH_USER_A's recipe id → `404` (not `403`, to avoid leaking existence).

### `PATCH /api/recipes/:id`
- **Happy path**: AUTH_USER patching own recipe `{ "title": "Banitsa v2" }` → `200`; response reflects the update; `updatedAt` advances.
- **Validation failures**:
  - Invalid field types (e.g. `title` as a number) → `400`.
  - Non-existent id → `404`.
- **Auth failures**: no/invalid token → `401`.
- **Idempotency / edge cases** (ownership): AUTH_USER_B patching AUTH_USER_A's recipe → `404`; the target recipe is unchanged in the DB.

### `DELETE /api/recipes/:id`
- **Happy path**: AUTH_USER deleting own recipe → `200`/`204`; a subsequent `GET /api/recipes/:id` for that id → `404`; the item disappears from `GET /api/recipes`.
- **Validation failures**: non-existent id → `404`.
- **Auth failures**: no/invalid token → `401`.
- **Idempotency / edge cases** (ownership): AUTH_USER_B deleting AUTH_USER_A's recipe → `404`; AUTH_USER_A's recipe still exists afterward.

### `GET /api/admin/overview`
- **Happy path**: AUTH_ADMIN → `200`; body is an array of `{ email, recipeCount }`; counts match actual per-user recipe totals (e.g. USER who created 1 recipe shows `recipeCount: 1`).
- **Validation failures**: n/a.
- **Auth failures**:
  - No/invalid token → `401`.
  - AUTH_USER (role USER) → `403`.
- **Idempotency / edge cases**: users with zero recipes still appear with `recipeCount: 0` (verify grouping does not drop them), OR document if only users with recipes are listed.

### `GET /api/admin/settings`
- **Happy path**: AUTH_ADMIN → `200`; body lists service/credential keys (e.g. postgresql, minio) with **masked** values and a `configured` boolean per key; no raw secret value is returned in plaintext.
- **Validation failures**: n/a.
- **Auth failures**:
  - No/invalid token → `401`.
  - AUTH_USER → `403`.

### `PATCH /api/admin/settings`
- **Happy path**: AUTH_ADMIN, body upserting a key-value pair (e.g. `{ "minio_access_key": "abc123" }`) → `200`; a subsequent `GET /api/admin/settings` shows that key as `configured: true` with a masked value.
- **Validation failures**: malformed body (non-object / wrong shape) → `400`.
- **Auth failures**:
  - No/invalid token → `401`.
  - AUTH_USER → `403`.
- **Idempotency / edge cases**: patching an already-set key overwrites it (upsert); `updatedAt` on the `SystemSetting` row advances; no duplicate rows created.

### `GET /api/health`
- **Happy path**: no auth → `200` (liveness); body indicates status ok.
- **Validation failures**: n/a.
- **Auth failures**: n/a — route is public (must succeed with no token).

### `GET /api/health/deep`
- **Happy path**: no auth, DB reachable → `200`; performs Prisma `SELECT 1`.
- **Validation failures**: n/a.
- **Auth failures**: n/a — public.
- **Idempotency / edge cases**: when the database is unreachable, returns a non-2xx (e.g. `503`) rather than `200` (distinguishes deep from liveness).

## UI / journey tests

### Journey: Sign up
- **Steps**: navigate to `/signup` → type email + password → submit.
- **Expected outcomes**: account created; user is authenticated (JWT stored in `localStorage`); redirected to `/recipes`; header shows logout control.
- **Negative path**: duplicate email or invalid input surfaces a visible error message; user remains on `/signup`; no token stored.

### Journey: Log in
- **Steps**: navigate to `/login` → enter seeded USER credentials → submit.
- **Expected outcomes**: JWT stored in `localStorage`; redirected to `/recipes`.
- **Negative path**: wrong password shows a visible error; stays on `/login`; no token stored.

### Journey: Create recipe
- **Steps**: authenticated, go to `/recipes/new` → fill title "Banitsa", ingredients, steps → submit.
- **Expected outcomes**: redirected to `/recipes`; the list renders a new element with `data-testid="recipe-item"` containing "Banitsa"; recipe persisted (survives reload).
- **Negative path**: submitting with an empty required field shows validation errors and does not navigate away; server error state is displayed if the API returns 4xx/5xx.

### Journey: View recipe list
- **Steps**: authenticated with ≥1 recipe → navigate to `/recipes`.
- **Expected outcomes**: one `data-testid="recipe-item"` per owned recipe; only the caller's recipes shown.
- **Negative path**: user with no recipes sees an empty-state message (no `recipe-item` elements).

### Journey: Edit recipe
- **Steps**: from `/recipes`, open a recipe's edit → `/recipes/:id/edit` → form pre-populated with existing values → change title → submit.
- **Expected outcomes**: redirected to `/recipes`; updated title visible in the corresponding `recipe-item`; change persisted.
- **Negative path**: navigating to `/recipes/:id/edit` for a non-owned/non-existent id surfaces a not-found/error state (API returns 404).

### Journey: Delete recipe (deep-linkable modal)
- **Steps**: on `/recipes`, trigger delete on an item → URL becomes `/recipes?modal=delete&id=<id>` → confirm.
- **Expected outcomes**: confirmation modal is shown when the URL carries `?modal=delete&id=`; on confirm, the item is removed from the list and the `modal` query param is cleared; deletion persisted.
- **Negative path**: cancel closes the modal, clears the query param, and leaves the recipe intact; deep-linking `?modal=delete&id=<nonexistent>` does not crash the list.

### Journey: Admin overview
- **Steps**: log in as seeded ADMIN → navigate to `/admin`.
- **Expected outcomes**: a table with `data-testid="admin-overview"` renders per-user rows showing email + recipe count matching backend data.
- **Negative path**: a USER navigating to `/admin` is blocked by `adminGuard` (redirected away / not rendered); the admin nav link is hidden for non-admins.

### Journey: Admin settings
- **Steps**: as ADMIN → navigate to `/admin/settings` → view service list (postgresql, minio) with configured/unconfigured badges → enter a credential in a per-service form → save.
- **Expected outcomes**: page lists each service with a badge; after saving, the service shows a `configured` badge; value shown masked; change reflected via `GET /api/admin/settings`.
- **Negative path**: a USER navigating to `/admin/settings` is blocked by `adminGuard`.

### Journey: Auth guard / route protection
- **Steps**: while logged out, attempt to navigate directly to `/recipes`, `/recipes/new`, `/recipes/:id/edit`, `/admin`, `/admin/settings`.
- **Expected outcomes**: each guarded route redirects an unauthenticated visitor to `/login` (authGuard); `/admin*` additionally requires ADMIN (adminGuard).
- **Negative path**: `''` redirects to `/recipes`; an unknown path (`**`) redirects per the wildcard route.

### Journey: Logout
- **Steps**: authenticated → click the logout button in the header.
- **Expected outcomes**: JWT removed from `localStorage`; redirected to `/login`; guarded routes no longer accessible.
- **Negative path**: after logout, using the browser back button to a guarded route still redirects to `/login`.

### Journey: Branding
- **Steps**: load the app.
- **Expected outcomes**: document `<title>` contains "FaithfulF Recipe Box"; the app header text contains "FaithfulF".
- **Negative path**: n/a.

## Data integrity tests
- After `POST /api/recipes`, exactly one new `Recipe` row exists with `userId` = the authenticated caller's id (never a body-supplied id).
- After `DELETE /api/recipes/:id` by the owner, the row is gone; a cross-user delete attempt leaves the row untouched (row count unchanged).
- `User.email` is unique — a duplicate registration never creates a second row.
- `User.passwordHash` stores a bcrypt hash, never the plaintext password; auth responses never expose `passwordHash`.
- Seed produces exactly one `USER` and one `ADMIN` with `role` set accordingly, and emits a parseable `SEED_CREDS_JSON={...}` line.
- `PATCH /api/admin/settings` upserts `SystemSetting` by `key` (no duplicate keys); `updatedAt` advances on change.
- A deleted/owned recipe's absence is reflected consistently across `GET /api/recipes` and `GET /api/recipes/:id` (no orphaned/stale reads).

## Out of scope
- **MinIO object storage / recipe attachments**: MinIO is provisioned and its credentials surface on `/admin/settings`, but the spec defines no upload/file behaviour on `Recipe` — no functional tests written (see `tasks.md` open question).
- **First-user-admin rule**: the pipeline `full_auth` rule is overridden by the spec's seeded-admin model; tests assert public signup always yields `USER`. Not testing first-user-becomes-admin.
- **Exact secret masking format**: the spec does not fix the masking scheme or the precise credential key list, so tests assert "value is masked and not plaintext" rather than a specific mask pattern.
- **Third-party integrations**: none declared in the spec; no integration-client tests.
- **JWT expiry duration / refresh tokens**: spec is silent on token lifetime and refresh flow; only presence/validity of the Bearer token is tested.
- **Rate limiting, pagination, and sorting** of recipe/admin lists: not specified.
- **Infrastructure/orchestration** (docker-compose wiring, nginx `/api` proxy, migrate/seed ordering): validated operationally at deploy time, not as functional API/UI cases here (health endpoints are the proxy for DB reachability).
