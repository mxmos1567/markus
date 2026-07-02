export interface Env {
  DB: D1Database
  MEDIA: R2Bucket
  AUTH_SECRET: string
}

export interface Shelf {
  id: string
  name: string
  slug: string
  description: string
  rows: number
  columns: number
  createdAt: string
  updatedAt: string
}

export interface ShelfSlot {
  id: string
  shelfId: string
  shelfSlug: string
  row: number
  column: number
  code: string
  status: 'free' | 'occupied' | 'reserved'
  memoryId: string | null
  createdAt: string
  updatedAt: string
}

export interface Memory {
  id: string
  title: string
  subtitle: string
  description: string
  date: string
  dateRange: { start: string; end?: string } | null
  location: { lat: number; lng: number; label?: string } | null
  tags: string[]
  notes: string
  favorite: boolean
  visibility: 'public' | 'private'
  slotId: string | null
  createdAt: string
  updatedAt: string
}

export interface MediaAsset {
  id: string
  memoryId: string
  kind: 'image' | 'video' | 'document'
  fileName: string
  mimeType: string
  size: number
  blobKey: string
  width?: number
  height?: number
  order: number
  createdAt: string
}

export interface User {
  id: string
  username: string
  displayName: string
  role: 'admin' | 'owner'
  passwordHash: string
  passwordSalt: string
  createdAt: string
  updatedAt: string
}
