import type { ShelfSlot } from '../domain/models'
import { getDb } from '../db/database'
import { nowIso } from '../utils/id'

export class SlotRepository {
  async list(shelfId?: string): Promise<ShelfSlot[]> {
    const db = await getDb()
    if (shelfId) return db.getAllFromIndex('slots', 'shelfId', shelfId)
    return db.getAll('slots')
  }

  async get(id: string): Promise<ShelfSlot | null> {
    const db = await getDb()
    return (await db.get('slots', id)) ?? null
  }

  async getByCode(shelfSlug: string, code: string): Promise<ShelfSlot | null> {
    const db = await getDb()
    return (await db.getFromIndex('slots', 'shelfSlugCode', [shelfSlug, code])) ?? null
  }

  async freeSlots(shelfId?: string): Promise<ShelfSlot[]> {
    const slots = await this.list(shelfId)
    return slots
      .filter((slot) => !slot.memoryId)
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
  }

  /** Picks a random free slot, excluding one already offered so "reroll" never repeats. */
  async pickRandomFree(shelfId?: string, exclude?: string): Promise<ShelfSlot | null> {
    const free = (await this.freeSlots(shelfId)).filter((slot) => slot.id !== exclude)
    if (free.length === 0) return null
    return free[Math.floor(Math.random() * free.length)]
  }

  /**
   * Assigns a memory to a slot, freeing whatever slot it previously
   * occupied. The QR code embedded in the physical shelf never changes —
   * only which memory it points to does.
   */
  async assignMemory(slotId: string, memoryId: string, previousSlotId?: string | null): Promise<ShelfSlot> {
    const db = await getDb()
    const slot = await db.get('slots', slotId)
    if (!slot) throw new Error(`Slot ${slotId} not found`)

    const updates: ShelfSlot[] = [{ ...slot, memoryId, updatedAt: nowIso() }]

    if (previousSlotId && previousSlotId !== slotId) {
      const previous = await db.get('slots', previousSlotId)
      if (previous) updates.push({ ...previous, memoryId: null, updatedAt: nowIso() })
    }

    const tx = db.transaction('slots', 'readwrite')
    await Promise.all(updates.map((update) => tx.store.put(update)))
    await tx.done
    return updates[0]
  }

  async release(slotId: string): Promise<ShelfSlot> {
    const db = await getDb()
    const slot = await db.get('slots', slotId)
    if (!slot) throw new Error(`Slot ${slotId} not found`)
    const updated: ShelfSlot = { ...slot, memoryId: null, updatedAt: nowIso() }
    await db.put('slots', updated)
    return updated
  }
}
