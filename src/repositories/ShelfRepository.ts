import type { CreateShelfInput, Shelf, ShelfSlot } from '../domain/models'
import { generateSlotCodes } from '../domain/models'
import { getDb } from '../db/database'
import { createId, nowIso } from '../utils/id'
import { slugify } from '../utils/slug'

export class ShelfRepository {
  async list(): Promise<Shelf[]> {
    const db = await getDb()
    return db.getAll('shelves')
  }

  async get(id: string): Promise<Shelf | null> {
    const db = await getDb()
    return (await db.get('shelves', id)) ?? null
  }

  async getBySlug(slug: string): Promise<Shelf | null> {
    const db = await getDb()
    return (await db.getFromIndex('shelves', 'slug', slug)) ?? null
  }

  async create(input: CreateShelfInput): Promise<{ shelf: Shelf; slots: ShelfSlot[] }> {
    const db = await getDb()
    const baseSlug = slugify(input.name) || 'shelf'
    let slug = baseSlug
    let attempt = 1
    while (await db.getFromIndex('shelves', 'slug', slug)) {
      slug = `${baseSlug}-${++attempt}`
    }

    const now = nowIso()
    const shelf: Shelf = {
      id: createId(),
      name: input.name,
      slug,
      rows: input.rows,
      columns: input.columns,
      createdAt: now,
      updatedAt: now,
    }
    await db.put('shelves', shelf)

    const codes = generateSlotCodes(input.rows, input.columns)
    const slots: ShelfSlot[] = codes.map((code, index) => ({
      id: createId(),
      shelfId: shelf.id,
      shelfSlug: shelf.slug,
      row: Math.floor(index / input.columns),
      column: index % input.columns,
      code,
      memoryId: null,
      createdAt: now,
      updatedAt: now,
    }))
    const tx = db.transaction('slots', 'readwrite')
    await Promise.all(slots.map((slot) => tx.store.put(slot)))
    await tx.done

    return { shelf, slots }
  }

  async update(shelf: Shelf): Promise<Shelf> {
    const db = await getDb()
    const updated: Shelf = { ...shelf, updatedAt: nowIso() }
    await db.put('shelves', updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(['shelves', 'slots'], 'readwrite')
    const slots = await tx.objectStore('slots').index('shelfId').getAll(id)
    await Promise.all([tx.objectStore('shelves').delete(id), ...slots.map((slot) => tx.objectStore('slots').delete(slot.id))])
    await tx.done
  }
}
