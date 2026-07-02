# Memory Shelf — Cloudflare Backend

This Worker is a drop-in replacement for the browser's IndexedDB storage.
It implements the exact same resources that `RestStorageProvider`
(`src/storage/rest/RestStorageProvider.ts`) expects, backed by:

- **D1** — shelves, slots, memories, media metadata, users, settings
- **R2** — the actual media files (images, videos, documents)

Swapping the frontend onto this backend requires no UI or repository
changes — only two build-time env vars.

## Setup

```bash
cd worker
npm install
wrangler d1 create memory-shelf        # copy the database_id into wrangler.toml
wrangler r2 bucket create memory-shelf-media
npm run db:migrate                     # applies schema.sql
wrangler secret put AUTH_SECRET        # generate a long random string
```

## Local development

```bash
npm run dev
```

## Deploy

```bash
npm run deploy
```

Then point the frontend at it — set these when building/deploying the
Vite app to Cloudflare Pages:

```
VITE_STORAGE_PROVIDER=rest
VITE_API_BASE_URL=https://memory-shelf-api.<your-subdomain>.workers.dev
```

## Seeding an admin user

The Worker doesn't auto-create a default admin (unlike the IndexedDB
provider). Insert one manually after migrating, e.g. via a small script
that calls `PasswordHasher.hash()` (same algorithm as
`src/services/PasswordHasher.ts`) and `wrangler d1 execute` an INSERT,
or temporarily expose a one-time seed route and remove it after use.

## Security notes / known seams

- All mutating routes (`PUT`/`DELETE`/`POST` other than `/auth/login`)
  require a bearer token issued by `POST /auth/login`.
- `GET /memories` and `GET /memories/:id` redact private memories for
  unauthenticated callers instead of exposing their content — the
  public slot page and `/timeline` only ever see what a visitor should.
- `GET /users*` always requires authentication; a REST deployment
  should log in through `POST /auth/login`, not by reading a user
  record and comparing hashes client-side (that pattern is only safe
  for the local-only IndexedDB provider, where "the wire" is the same
  device). If you wire `AuthService` up against this backend, prefer
  calling `/auth/login` directly rather than `UserRepository.getByUsername`.
- `POST /backup/import` is intentionally a stub — for a D1-backed
  archive, restoring a full backup is safer as a direct
  `wrangler d1 execute` against the exported JSON turned into SQL,
  reviewed before running, rather than an unauthenticated bulk write
  endpoint.
