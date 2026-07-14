// Prisma 7 configuration file.
//
// DATABASE_URL is injected via environment variable at runtime (K8s secret /
// Docker ENV). dotenv is intentionally absent — it is not installed in
// backend/package.json and is not needed in Docker or K8s contexts.
//
// The runtime PrismaClient connects via the @prisma/adapter-pg driver adapter
// (NOT this config). The datasource.url below is used ONLY by the Prisma CLI
// migration commands (`migrate deploy` / `migrate status` / `migrate dev`),
// which — as of Prisma 7 — require datasource.url to be present in the config
// file. It is read from the DATABASE_URL env var injected by the platform, so
// no secret is hard-coded here.
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
