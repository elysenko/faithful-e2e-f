# Architecture — FaithfulF Recipe Box

## Scaffolded Platforms

| Platform | Status | Location | Template Source |
|---|---|---|---|
| `backend` | ✅ newly scaffolded | `backend/` | `template-backend` (NestJS + Prisma) |
| `web` (Angular SPA) | ✅ newly scaffolded | `frontend/` | `template-web` (Angular 17+) |

## Directory Layout

```
.
├── backend/           # NestJS API (TypeScript)
│   ├── src/           # Source (auth, health, prisma modules)
│   ├── prisma/        # schema.prisma, migrations, seed
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── Dockerfile.backend
├── frontend/          # Angular SPA (standalone components)
│   ├── src/app/
│   │   ├── core/      # guards, interceptors, services
│   │   └── features/  # home, login components
│   └── angular.json
├── nginx.conf         # nginx config (proxies /api → backend)
├── Dockerfile.backend
├── Dockerfile.frontend
├── colossus.yaml      # Build manifest for deploy agents
├── .colossus-acceptance.json
└── ATLAS_STACK.md
```

## Stack Details

- **Backend:** NestJS (TypeScript), Prisma ORM, PostgreSQL, JWT auth (passport-jwt)
- **Frontend:** Angular 17+ standalone components, reactive forms, HttpClient
- **API:** REST (global `/api` prefix); backend port 3000
- **Auth:** JWT Bearer token stored in localStorage; roles embedded in payload
- **Health:** `GET /api/health/live` and `GET /api/health/ready` (public)

## Next Steps for Developers

1. **Set secrets:** Edit `backend/.env` — set `DATABASE_URL` and `JWT_SECRET`
2. **Database:** Start PostgreSQL (e.g. `docker-compose up postgres`), then run:
   ```bash
   cd backend && npx prisma migrate dev && npx prisma db seed
   ```
3. **Run backend:** `cd backend && npm run start:dev`
4. **Run frontend:** `cd frontend && npm start` (proxy `/api` → localhost:3000)
5. **Build for prod:** Use Dockerfiles or `colossus.yaml` build instructions

## Build Notes

- Frontend Angular project name: `frontend` (from `angular.json`)
- Angular output dir: `dist/frontend/browser`
- `nginx.conf` proxies `/api/*` → backend service
- `colossus.yaml` references `Dockerfile.backend` for the NestJS container
