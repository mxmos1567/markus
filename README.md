# Memory Shelf

A simple, practical digital museum for personal memories.

You create one or more shelves, each with a grid of rows × columns. The
app generates every slot automatically (A1, A2, A3…), and each slot has
a permanent public URL and QR code. You write a memory and either
assign it to a slot manually or let the app pick a random free one. You
print the slot's QR code and stick it onto your physical shelf.
Scanning it opens whichever memory is currently assigned there — no
browsing, no list, no feed. Moving a memory to a different slot never
changes the QR code itself, only what it opens. The only place multiple
memories can be discovered is `/timeline`.

Cinematic Archive design: near-black/violet backgrounds, warm gold
accents, Instrument Serif headings, slow deliberate motion.

## Stack

- React + TypeScript + Vite, PWA (offline cache via Workbox)
- React Router: public routes `/`, `/slot/:shelf/:slot`, `/timeline`;
  admin routes under `/admin/*`, code-split and lazy loaded so public
  visitors never download the admin bundle
- Tailwind CSS v4, `@tailwindcss/typography` for the markdown story
- Everything lives in the browser's IndexedDB (via `idb`) — no backend,
  fully usable offline
- Static build — no required backend of any kind. Deployable as-is to
  Cloudflare Pages (`public/_redirects`) or hosted fully locally, e.g.
  on a Raspberry Pi behind nginx (`deploy/nginx.conf.example`)

## Architecture

```
src/domain/models     Shelf, ShelfSlot, Memory, MediaAsset — plain types
src/db/database.ts    The only file that talks to IndexedDB directly
src/repositories       ShelfRepository (slug + slot-grid generation),
                       SlotRepository (manual/random assignment),
                       MemoryRepository, MediaRepository
src/services           AuthService (single admin account), QrCodeService,
                        BackupService (JSON export/import)
src/context            React wiring: ServiceContainer + AuthContext
src/pages/public        HomePage, SlotPage (/slot/:shelf/:slot), TimelinePage
src/pages/admin         Dashboard, Shelves, Memories, QR Codes, Import/Export, Settings
```

There's deliberately no storage-provider abstraction or separate
backend right now — repositories talk directly to one database module,
and there's one admin account. If a real multi-device/multi-user
backend is ever needed, `src/repositories/*` is the seam to introduce
one behind, without touching pages.

A shelf slot's QR code is permanent from the moment the shelf is
created — it always resolves to `/slot/:shelfSlug/:code`. A memory only
gets a public URL once it's placed on a slot; an empty slot shows a
dedicated "waiting for its memory" page instead of a 404.

QR codes encode **Admin → Settings → QR Code Base URL** + that path —
defaults to the browser's current origin, but set it explicitly (e.g.
`http://erinnerungsregal.local`) when hosting locally so codes still
resolve correctly from any device on the network, regardless of which
machine generated them.

Password hashing works over plain HTTP on a LAN IP (e.g.
`http://192.168.x.x` on a Raspberry Pi), not just HTTPS/localhost.
Browsers only expose `crypto.subtle` in "secure contexts" — HTTPS or
`localhost` — so `PasswordHasher` (`src/services/PasswordHasher.ts`)
detects when it's unavailable and falls back to the same PBKDF2-SHA256
algorithm implemented in pure JS (`@noble/hashes`, audited,
zero-dependency) instead. Login behavior is identical either way.

Once a memory has a slot, moving it to a different one requires an
explicit "Move to a different slot" action and a confirmation — the
normal flow is create → assign once → print → done.

Memory dates can be exact or "I only know the month" (stored as
`YYYY-MM` instead of `YYYY-MM-DD`); the dashboard's **This Month in
Memories** widget matches on calendar month alone, regardless of year
or day, since most memories won't have an exact day.

**QR label sheet printing** (Admin → QR Codes → Print as Label Sheet):
prints a shelf's slot QR codes onto Avery L4730REV-25 sheets (or future
templates — see `src/domain/labelTemplates.ts`), with QR-only / QR+slot
code / QR+title content options, and an interactive picker for reusing
a partially-used physical sheet (click the first free position; earlier
positions stay blank; overflow continues on additional full sheets
automatically).

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
Import/Export** regularly to download a full JSON backup (shelves,
slots, memories, photos/videos/documents included as embedded data) —
this is your only copy outside the browser.
