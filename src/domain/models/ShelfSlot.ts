import type { Entity, SlotStatus } from './common'

export interface ShelfSlot extends Entity {
  shelfId: string
  shelfSlug: string
  row: number
  column: number
  code: string
  status: SlotStatus
  memoryId: string | null
}

export function slotRoute(shelfSlug: string, code: string): string {
  return `/slot/${shelfSlug}/${code}`
}
