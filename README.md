# Memory Shelf

A digital museum for personal memories. Every shelf compartment gets a
permanent QR code; scanning it opens exactly one memory — no browsing,
no list, no feed. The only place multiple memories can be discovered is
`/timeline`.

See the full product spec in the project's original brief for the
design philosophy (Cinematic Archive: near-black/violet backgrounds,
warm gold accents, Instrument Serif headings, slow deliberate motion).

## Stack

- React + TypeScript + Vite, PWA (offline cache via Workbox)
- React Router for public (`/`, `/slot/:shelf/:slot`, `/timeline`) and
  admin (`/admin/*`) routes — the admin bundle is code-split and lazy
  loaded so public visitors never download it
- Tailwind CSS v4 for styling, `@tailwindcss/typography` for markdown
- IndexedDB by default (via `idb`) — the app is fully usable offline
  with zero backend
- A Cloudflare Worker + D1 + R2 backend in `worker/` as a drop-in
  replacement, see [worker/README.md](worker/README.md)

## Architecture

```
src/domain/models        Plain types: Shelf, ShelfSlot, Memory, MediaAsset, User
src/storage               IStorageProvider contract + IndexedDB / REST implementations
src/repositories          Business logic on top of IStorageProvider (slug generation,
                          random slot assignment, media upload, credential verification)
src/services              Cross-cutting services: auth session, QR codes, backups
src/context               React wiring: ServiceContainer + AuthContext
src/pages/public          The visitor experience: slot page, empty slot, timeline
src/pages/admin           The administration area
worker/                   Cloudflare Worker implementing the same REST contract
```

**Storage Provider Pattern**: every persistence backend implements
`IStorageProvider` (`src/storage/IStorageProvider.ts`). The rest of the
app — repositories, pages, components — only ever talks to that
interface. Switching backends is a matter of env vars, not code:

```bash
VITE_STORAGE_PROVIDER=rest
VITE_API_BASE_URL=https://memory-shelf-api.<your-subdomain>.workers.dev
```

**Repository Pattern**: `src/repositories/*` wrap `IStorageProvider`
with domain logic (e.g. `ShelfRepository.create` slugifies the name and
generates the full slot grid; `SlotRepository.pickRandomFree` implements
reroll-able random assignment). Pages depend on repositories, never on
storage directly.

**Authentication** is part of the storage contract
(`verifyCredentials`), not layered on top of it — the IndexedDB
provider checks the password hash locally, the REST provider calls the
Worker's `POST /auth/login` and never sees a password hash over the
wire. See [worker/README.md](worker/README.md#security-notes--known-seams)
for the reasoning.

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
```

On first load, a default admin user is seeded automatically (IndexedDB
backend only): username `admin`, password `change-me-now`. Change it
immediately from **Admin → Settings**.

```bash
npm run build      # tsc -b && vite build
npm run lint       # oxlint
```

## Regenerating PWA icons

`scripts/generate-icons.mjs` writes `public/pwa-192.png` and
`public/pwa-512.png` from scratch (no image dependencies) — re-run it
if you change the icon design.

## Deploying the Cloudflare backend

See [worker/README.md](worker/README.md).
