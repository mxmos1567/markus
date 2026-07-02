import type { IStorageProvider } from '../storage/IStorageProvider'
import type { ShelfSlot } from '../domain/models'
import { nowIso } from '../utils/id'

export class SlotRepository {
  private readonly storage: IStorageProvider

  constructor(storage: IStorageProvider) {
    this.storage = storage
  }

  list(shelfId?: string): Promise<ShelfSlot[]> {
    return this.storage.listSlots(shelfId)
  }

  get(id: string): Promise<ShelfSlot | null> {
    return this.storage.getSlot(id)
  }

  getByCode(shelfSlug: string, code: string): Promise<ShelfSlot | null> {
    return this.storage.getSlotByCode(shelfSlug, code)
  }

  async freeSlots(shelfId?: string): Promise<ShelfSlot[]> {
    const slots = await this.storage.listSlots(shelfId)
    return slots.filter((slot) => slot.status === 'free').sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
  }

  /** Picks a random free slot, excluding one already offered so "reroll" never repeats. */
  async pickRandomFree(shelfId?: string, exclude?: string): Promise<ShelfSlot | null> {
    const free = (await this.freeSlots(shelfId)).filter((slot) => slot.id !== exclude)
    if (free.length === 0) return null
    return free[Math.floor(Math.random() * free.length)]
  }

  async setStatus(id: string, status: ShelfSlot['status']): Promise<ShelfSlot> {
    const slot = await this.storage.getSlot(id)
    if (!slot) throw new Error(`Slot ${id} not found`)
    const updated: ShelfSlot = { ...slot, status, updatedAt: nowIso() }
    await this.storage.saveSlots([updated])
    return updated
  }

  /**
   * Assigns a memory to a slot, freeing whatever slot it previously
   * occupied. The QR code embedded in the physical shelf never changes —
   * only which memory it points to does.
   */
  async assignMemory(slotId: string, memoryId: string, previousSlotId?: string | null): Promise<ShelfSlot> {
    const slot = await this.storage.getSlot(slotId)
    if (!slot) throw new Error(`Slot ${slotId} not found`)

    const updates: ShelfSlot[] = [{ ...slot, status: 'occupied', memoryId, updatedAt: nowIso() }]

    if (previousSlotId && previousSlotId !== slotId) {
      const previous = await this.storage.getSlot(previousSlotId)
      if (previous) {
        updates.push({ ...previous, status: 'free', memoryId: null, updatedAt: nowIso() })
      }
    }

    await this.storage.saveSlots(updates)
    return updates[0]
  }

  async release(slotId: string): Promise<ShelfSlot> {
    const slot = await this.storage.getSlot(slotId)
    if (!slot) throw new Error(`Slot ${slotId} not found`)
    const updated: ShelfSlot = { ...slot, status: 'free', memoryId: null, updatedAt: nowIso() }
    await this.storage.saveSlots([updated])
    return updated
  }
}
