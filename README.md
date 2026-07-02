# Memory Shelf

A simple, practical digital museum for personal memories.

You write a memory (title, date, story, photos/video/documents). The
app gives it a permanent link and a QR code. You print the QR code and
stick it into your physical shelf. Scanning it opens exactly that
memory — no browsing, no list, no feed. The only place multiple
memories can be discovered is `/timeline`.

Cinematic Archive design: near-black/violet backgrounds, warm gold
accents, Instrument Serif headings, slow deliberate motion.

## Stack

- React + TypeScript + Vite, PWA (offline cache via Workbox)
- React Router: public routes `/`, `/memory/:slug`, `/timeline`; admin
  routes under `/admin/*`, code-split and lazy loaded so public
  visitors never download the admin bundle
- Tailwind CSS v4, `@tailwindcss/typography` for the markdown story
- Everything lives in the browser's IndexedDB (via `idb`) — no backend,
  fully usable offline
- Static build, deployable as-is to Cloudflare Pages (see
  `public/_redirects` for SPA routing)

## Architecture

```
src/domain/models     Memory, MediaAsset — plain types
src/db/database.ts    The only file that talks to IndexedDB directly
src/repositories       MemoryRepository (slug generation, CRUD),
                       MediaRepository (blob storage, uploads)
src/services           AuthService (single admin account), QrCodeService,
                        BackupService (JSON export/import)
src/context            React wiring: ServiceContainer + AuthContext
src/pages/public        HomePage, MemoryPage (/memory/:slug), TimelinePage
src/pages/admin         Dashboard, Memories, QR Codes, Import/Export, Settings
```

There's deliberately no storage-provider abstraction or separate
backend right now — one repository, one database module, one admin
account. If a real multi-device/multi-user backend is ever needed,
`src/repositories/*` is the seam to introduce one behind, without
touching pages.

Each memory gets a unique `slug` (from its title) the moment it's
created — that's what the QR code encodes, and it never changes even
if the title or story is edited later.

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
```

On first load, a default admin account is seeded: username `admin`,
password `change-me-now`. Change it immediately from **Admin → Settings**.

```bash
npm run build      # tsc -b && vite build
npm run lint       # oxlint
```

## Regenerating PWA icons

`scripts/generate-icons.mjs` writes `public/pwa-192.png` and
`public/pwa-512.png` from scratch (no image dependencies) — re-run it
if you change the icon design.

## Backing up your data

Since everything lives in the browser's IndexedDB, use **Admin →
Import/Export** regularly to download a full JSON backup (memories,
photos/videos/documents included as embedded data) — this is your only
copy outside the browser.
