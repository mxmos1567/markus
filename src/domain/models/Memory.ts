import type { Entity } from './common'

export interface Memory extends Entity {
  title: string
  date: string
  description: string
  /** The shelf slot whose permanent QR code currently opens this memory, if placed. */
  slotId: string | null
}

export interface CreateMemoryInput {
  title: string
  date: string
  description: string
}
