import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, Memory } from './types'
import { mediaFromRow, memoryFromRow, shelfFromRow, slotFromRow, userFromRow } from './mappers'
import { issueToken, verifyPassword, verifyToken } from './auth'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

async function getAuth(c: { req: { header: (name: string) => string | undefined }; env: Env }) {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  return verifyToken(c.env.AUTH_SECRET, header.slice('Bearer '.length))
}

function requireAuth(payload: unknown) {
  if (!payload) throw new HttpError(401, 'Authentication required')
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

app.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status as 401 | 403 | 404)
  console.error(err)
  return c.json({ error: 'Internal error' }, 500)
})

app.get('/health', (c) => c.json({ ok: true }))

// --- Auth -------------------------------------------------------------
app.post('/auth/login', async (c) => {
  const { username, password } = await c.req.json<{ username: string; password: string }>()
  const row = await c.env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()
  if (!row) throw new HttpError(401, 'Invalid username or password')
  const user = userFromRow(row)
  const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt)
  if (!valid) throw new HttpError(401, 'Invalid username or password')
  const token = await issueToken(c.env.AUTH_SECRET, {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  })
  return c.json({ token, session: { userId: user.id, username: user.username, displayName: user.displayName, role: user.role } })
})

// --- Shelves ------------------------------------------------------------
app.get('/shelves', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM shelves ORDER BY created_at').all()
  return c.json(results!.map(shelfFromRow))
})

app.get('/shelves/by-slug/:slug', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM shelves WHERE slug = ?').bind(c.req.param('slug')).first()
  return c.json(row ? shelfFromRow(row) : null)
})

app.get('/shelves/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM shelves WHERE id = ?').bind(c.req.param('id')).first()
  return c.json(row ? shelfFromRow(row) : null)
})

app.put('/shelves/:id', async (c) => {
  requireAuth(await getAuth(c))
  const shelf = await c.req.json<Record<string, unknown>>()
  await c.env.DB.prepare(
    `INSERT INTO shelves (id, name, slug, description, rows, columns, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
     ON CONFLICT(id) DO UPDATE SET name=?2, slug=?3, description=?4, rows=?5, columns=?6, updated_at=?8`,
  )
    .bind(shelf.id, shelf.name, shelf.slug, shelf.description, shelf.rows, shelf.columns, shelf.createdAt, shelf.updatedAt)
    .run()
  return c.json(shelf)
})

app.delete('/shelves/:id', async (c) => {
  requireAuth(await getAuth(c))
  await c.env.DB.prepare('DELETE FROM shelves WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})

// --- Slots ----------------------------------------------------------------
app.get('/slots', async (c) => {
  const shelfId = c.req.query('shelfId')
  const stmt = shelfId
    ? c.env.DB.prepare('SELECT * FROM slots WHERE shelf_id = ? ORDER BY code').bind(shelfId)
    : c.env.DB.prepare('SELECT * FROM slots ORDER BY code')
  const { results } = await stmt.all()
  return c.json(results!.map(slotFromRow))
})

app.get('/slots/by-code/:shelfSlug/:code', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM slots WHERE shelf_slug = ? AND code = ?')
    .bind(c.req.param('shelfSlug'), c.req.param('code'))
    .first()
  return c.json(row ? slotFromRow(row) : null)
})

app.get('/slots/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM slots WHERE id = ?').bind(c.req.param('id')).first()
  return c.json(row ? slotFromRow(row) : null)
})

app.put('/slots/batch', async (c) => {
  requireAuth(await getAuth(c))
  const slots = await c.req.json<Record<string, unknown>[]>()
  const statements = slots.map((slot) =>
    c.env.DB.prepare(
      `INSERT INTO slots (id, shelf_id, shelf_slug, "row", "column", code, status, memory_id, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
       ON CONFLICT(id) DO UPDATE SET status=?7, memory_id=?8, updated_at=?10`,
    ).bind(
      slot.id,
      slot.shelfId,
      slot.shelfSlug,
      slot.row,
      slot.column,
      slot.code,
      slot.status,
      slot.memoryId ?? null,
      slot.createdAt,
      slot.updatedAt,
    ),
  )
  await c.env.DB.batch(statements)
  return c.json(slots)
})

app.delete('/slots', async (c) => {
  requireAuth(await getAuth(c))
  const shelfId = c.req.query('shelfId')
  await c.env.DB.prepare('DELETE FROM slots WHERE shelf_id = ?').bind(shelfId).run()
  return c.body(null, 204)
})

// --- Memories (with visibility redaction for unauthenticated callers) -----
function redact(memory: Memory, authed: boolean): Memory {
  if (authed || memory.visibility === 'public') return memory
  return {
    ...memory,
    title: '',
    subtitle: '',
    description: '',
    tags: [],
    notes: '',
    location: null,
  }
}

app.get('/memories', async (c) => {
  const authed = Boolean(await getAuth(c))
  const { results } = await c.env.DB.prepare('SELECT * FROM memories ORDER BY date DESC').all()
  const memories = results!.map(memoryFromRow)
  return c.json(authed ? memories : memories.filter((m) => m.visibility === 'public'))
})

app.get('/memories/:id', async (c) => {
  const authed = Boolean(await getAuth(c))
  const row = await c.env.DB.prepare('SELECT * FROM memories WHERE id = ?').bind(c.req.param('id')).first()
  if (!row) return c.json(null)
  return c.json(redact(memoryFromRow(row), authed))
})

app.put('/memories/:id', async (c) => {
  requireAuth(await getAuth(c))
  const m = await c.req.json<Record<string, any>>()
  await c.env.DB.prepare(
    `INSERT INTO memories (id, title, subtitle, description, date, date_range_start, date_range_end,
        location_lat, location_lng, location_label, tags, notes, favorite, visibility, slot_id, created_at, updated_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17)
     ON CONFLICT(id) DO UPDATE SET title=?2, subtitle=?3, description=?4, date=?5, date_range_start=?6,
        date_range_end=?7, location_lat=?8, location_lng=?9, location_label=?10, tags=?11, notes=?12,
        favorite=?13, visibility=?14, slot_id=?15, updated_at=?17`,
  )
    .bind(
      m.id,
      m.title,
      m.subtitle,
      m.description,
      m.date,
      m.dateRange?.start ?? null,
      m.dateRange?.end ?? null,
      m.location?.lat ?? null,
      m.location?.lng ?? null,
      m.location?.label ?? null,
      JSON.stringify(m.tags ?? []),
      m.notes,
      m.favorite ? 1 : 0,
      m.visibility,
      m.slotId ?? null,
      m.createdAt,
      m.updatedAt,
    )
    .run()
  return c.json(m)
})

app.delete('/memories/:id', async (c) => {
  requireAuth(await getAuth(c))
  await c.env.DB.prepare('DELETE FROM memories WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})

// --- Media (files live in R2, metadata in D1) ------------------------------
app.get('/media', async (c) => {
  const authed = Boolean(await getAuth(c))
  const memoryId = c.req.query('memoryId')
  if (!memoryId) return c.json([])
  const memoryRow = await c.env.DB.prepare('SELECT visibility FROM memories WHERE id = ?').bind(memoryId).first()
  if (memoryRow && memoryRow.visibility === 'private' && !authed) return c.json([])
  const { results } = await c.env.DB.prepare('SELECT * FROM media WHERE memory_id = ? ORDER BY "order"').bind(memoryId).all()
  return c.json(results!.map(mediaFromRow))
})

app.post('/media', async (c) => {
  requireAuth(await getAuth(c))
  const form = await c.req.formData()
  const asset = JSON.parse(form.get('asset') as string) as Record<string, any>
  const file = form.get('file') as unknown as File
  await c.env.MEDIA.put(asset.blobKey, await file.arrayBuffer(), { httpMetadata: { contentType: asset.mimeType } })
  await c.env.DB.prepare(
    `INSERT INTO media (id, memory_id, kind, file_name, mime_type, size, blob_key, width, height, "order", created_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)`,
  )
    .bind(
      asset.id,
      asset.memoryId,
      asset.kind,
      asset.fileName,
      asset.mimeType,
      asset.size,
      asset.blobKey,
      asset.width ?? null,
      asset.height ?? null,
      asset.order,
      asset.createdAt,
    )
    .run()
  return c.json(asset)
})

app.get('/media/:id/blob', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM media WHERE id = ?').bind(c.req.param('id')).first()
  if (!row) return c.notFound()
  const authed = Boolean(await getAuth(c))
  const memoryRow = await c.env.DB.prepare('SELECT visibility FROM memories WHERE id = ?').bind(row.memory_id).first()
  if (memoryRow?.visibility === 'private' && !authed) throw new HttpError(403, 'This memory is private')
  const object = await c.env.MEDIA.get(row.blob_key as string)
  if (!object) return c.notFound()
  return new Response(object.body, {
    headers: { 'Content-Type': (row.mime_type as string) ?? 'application/octet-stream' },
  })
})

app.delete('/media/:id', async (c) => {
  requireAuth(await getAuth(c))
  const row = await c.env.DB.prepare('SELECT blob_key FROM media WHERE id = ?').bind(c.req.param('id')).first()
  if (row) await c.env.MEDIA.delete(row.blob_key as string)
  await c.env.DB.prepare('DELETE FROM media WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})

// --- Users (never exposed to unauthenticated callers) ----------------------
app.get('/users', async (c) => {
  requireAuth(await getAuth(c))
  const { results } = await c.env.DB.prepare('SELECT * FROM users').all()
  return c.json(results!.map(userFromRow))
})

app.get('/users/by-username/:username', async (c) => {
  requireAuth(await getAuth(c))
  const row = await c.env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(c.req.param('username')).first()
  return c.json(row ? userFromRow(row) : null)
})

app.get('/users/:id', async (c) => {
  requireAuth(await getAuth(c))
  const row = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(c.req.param('id')).first()
  return c.json(row ? userFromRow(row) : null)
})

app.put('/users/:id', async (c) => {
  requireAuth(await getAuth(c))
  const u = await c.req.json<Record<string, any>>()
  await c.env.DB.prepare(
    `INSERT INTO users (id, username, display_name, role, password_hash, password_salt, created_at, updated_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8)
     ON CONFLICT(id) DO UPDATE SET username=?2, display_name=?3, role=?4, password_hash=?5, password_salt=?6, updated_at=?8`,
  )
    .bind(u.id, u.username, u.displayName, u.role, u.passwordHash, u.passwordSalt, u.createdAt, u.updatedAt)
    .run()
  return c.json(u)
})

app.delete('/users/:id', async (c) => {
  requireAuth(await getAuth(c))
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})

// --- Settings ---------------------------------------------------------------
app.get('/settings/:key', async (c) => {
  const row = await c.env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(c.req.param('key')).first()
  return c.json(row ? JSON.parse(row.value as string) : null)
})

app.put('/settings/:key', async (c) => {
  requireAuth(await getAuth(c))
  const value = await c.req.json()
  await c.env.DB.prepare('INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value=?2')
    .bind(c.req.param('key'), JSON.stringify(value))
    .run()
  return c.json(value)
})

// --- Backup / restore (D1 rows only — media stays in R2) --------------------
app.get('/backup/export', async (c) => {
  requireAuth(await getAuth(c))
  const [shelves, slots, memories, media, users, settings] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM shelves').all(),
    c.env.DB.prepare('SELECT * FROM slots').all(),
    c.env.DB.prepare('SELECT * FROM memories').all(),
    c.env.DB.prepare('SELECT * FROM media').all(),
    c.env.DB.prepare('SELECT * FROM users').all(),
    c.env.DB.prepare('SELECT * FROM settings').all(),
  ])
  const settingsMap: Record<string, unknown> = {}
  for (const row of settings.results ?? []) {
    settingsMap[row.key as string] = JSON.parse(row.value as string)
  }
  return c.json({
    version: 1,
    exportedAt: new Date().toISOString(),
    shelves: shelves.results!.map(shelfFromRow),
    slots: slots.results!.map(slotFromRow),
    memories: memories.results!.map(memoryFromRow),
    media: media.results!.map(mediaFromRow),
    mediaBlobs: {},
    users: users.results!.map(userFromRow),
    settings: settingsMap,
  })
})

app.post('/backup/import', async (c) => {
  requireAuth(await getAuth(c))
  // A full restore should run through wrangler d1 execute for large
  // archives; this endpoint is a convenience path for small/medium ones.
  return c.json({ error: 'Not yet implemented — restore via wrangler d1 execute with the exported schema.' }, 501)
})

export default app
