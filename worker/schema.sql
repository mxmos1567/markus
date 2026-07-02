-- Memory Shelf D1 schema.
-- Mirrors the domain model in src/domain/models so the REST contract
-- exposed by this Worker matches RestStorageProvider exactly.

CREATE TABLE IF NOT EXISTS shelves (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  rows INTEGER NOT NULL,
  columns INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS slots (
  id TEXT PRIMARY KEY,
  shelf_id TEXT NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
  shelf_slug TEXT NOT NULL,
  "row" INTEGER NOT NULL,
  "column" INTEGER NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('free', 'occupied', 'reserved')),
  memory_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (shelf_slug, code)
);

CREATE INDEX IF NOT EXISTS idx_slots_shelf_id ON slots(shelf_id);

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  date_range_start TEXT,
  date_range_end TEXT,
  location_lat REAL,
  location_lng REAL,
  location_label TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  favorite INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  slot_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video', 'document')),
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  blob_key TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_memory_id ON media(memory_id);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'owner')),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
