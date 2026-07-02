import type { Entity } from './common'

export interface Memory extends Entity {
  /** Slug used in the memory's permanent public URL and QR code: /memory/:slug */
  slug: string
  title: string
  date: string
  description: string
}

export interface CreateMemoryInput {
  title: string
  date: string
  description: string
}
