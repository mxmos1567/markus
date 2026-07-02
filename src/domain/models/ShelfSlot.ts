import type { Entity } from './common'

export interface ShelfSlot extends Entity {
  shelfId: string
  shelfSlug: string
  row: number
  column: number
  code: string
  /** Which memory this permanent QR code currently opens, if any. */
  memoryId: string | null
}

export function slotRoute(shelfSlug: string, code: string): string {
  return `/slot/${shelfSlug}/${code}`
}
