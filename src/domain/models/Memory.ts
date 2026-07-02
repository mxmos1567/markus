import type { DateRange, Entity, GeoLocation, Visibility } from './common'

export interface Memory extends Entity {
  title: string
  subtitle: string
  description: string
  date: string
  dateRange: DateRange | null
  location: GeoLocation | null
  tags: string[]
  notes: string
  favorite: boolean
  visibility: Visibility
  slotId: string | null
}

export interface CreateMemoryInput {
  title: string
  subtitle: string
  description: string
  date: string
  dateRange: DateRange | null
  location: GeoLocation | null
  tags: string[]
  notes: string
  favorite: boolean
  visibility: Visibility
}
