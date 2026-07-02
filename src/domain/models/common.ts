export type SlotStatus = 'free' | 'occupied' | 'reserved'

export type Visibility = 'public' | 'private'

export type Role = 'admin' | 'owner'

export interface DateRange {
  start: string
  end?: string
}

export interface GeoLocation {
  lat: number
  lng: number
  label?: string
}

export interface Entity {
  id: string
  createdAt: string
  updatedAt: string
}
