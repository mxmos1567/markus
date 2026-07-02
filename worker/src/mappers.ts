import type { Memory, MediaAsset, Shelf, ShelfSlot, User } from './types'

export function shelfFromRow(row: Record<string, unknown>): Shelf {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string,
    rows: row.rows as number,
    columns: row.columns as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function slotFromRow(row: Record<string, unknown>): ShelfSlot {
  return {
    id: row.id as string,
    shelfId: row.shelf_id as string,
    shelfSlug: row.shelf_slug as string,
    row: row.row as number,
    column: row.column as number,
    code: row.code as string,
    status: row.status as ShelfSlot['status'],
    memoryId: (row.memory_id as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function memoryFromRow(row: Record<string, unknown>): Memory {
  const start = row.date_range_start as string | null
  const end = row.date_range_end as string | null
  const lat = row.location_lat as number | null
  const lng = row.location_lng as number | null
  return {
    id: row.id as string,
    title: row.title as string,
    subtitle: row.subtitle as string,
    description: row.description as string,
    date: row.date as string,
    dateRange: start ? { start, end: end ?? undefined } : null,
    location: lat != null && lng != null ? { lat, lng, label: (row.location_label as string) ?? undefined } : null,
    tags: JSON.parse((row.tags as string) ?? '[]'),
    notes: row.notes as string,
    favorite: Boolean(row.favorite),
    visibility: row.visibility as Memory['visibility'],
    slotId: (row.slot_id as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function mediaFromRow(row: Record<string, unknown>): MediaAsset {
  return {
    id: row.id as string,
    memoryId: row.memory_id as string,
    kind: row.kind as MediaAsset['kind'],
    fileName: row.file_name as string,
    mimeType: row.mime_type as string,
    size: row.size as number,
    blobKey: row.blob_key as string,
    width: (row.width as number | null) ?? undefined,
    height: (row.height as number | null) ?? undefined,
    order: row.order as number,
    createdAt: row.created_at as string,
  }
}

export function userFromRow(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    username: row.username as string,
    displayName: row.display_name as string,
    role: row.role as User['role'],
    passwordHash: row.password_hash as string,
    passwordSalt: row.password_salt as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}
