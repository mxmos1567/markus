import type { IStorageProvider } from '../storage/IStorageProvider'
import type { CreateShelfInput, Shelf, ShelfSlot } from '../domain/models'
import { generateSlotCodes } from '../domain/models'
import { createId, nowIso } from '../utils/id'
import { slugify } from '../utils/slug'

export class ShelfRepository {
  private readonly storage: IStorageProvider

  constructor(storage: IStorageProvider) {
    this.storage = storage
  }

  list(): Promise<Shelf[]> {
    return this.storage.listShelves()
  }

  get(id: string): Promise<Shelf | null> {
    return this.storage.getShelf(id)
  }

  getBySlug(slug: string): Promise<Shelf | null> {
    return this.storage.getShelfBySlug(slug)
  }

  async create(input: CreateShelfInput): Promise<{ shelf: Shelf; slots: ShelfSlot[] }> {
    const baseSlug = slugify(input.name) || 'shelf'
    let slug = baseSlug
    let attempt = 1
    while (await this.storage.getShelfBySlug(slug)) {
      slug = `${baseSlug}-${++attempt}`
    }

    const now = nowIso()
    const shelf: Shelf = {
      id: createId(),
      name: input.name,
      slug,
      description: input.description,
      rows: input.rows,
      columns: input.columns,
      createdAt: now,
      updatedAt: now,
    }
    await this.storage.saveShelf(shelf)

    const codes = generateSlotCodes(input.rows, input.columns)
    const slots: ShelfSlot[] = codes.map((code, index) => ({
      id: createId(),
      shelfId: shelf.id,
      shelfSlug: shelf.slug,
      row: Math.floor(index / input.columns),
      column: index % input.columns,
      code,
      status: 'free',
      memoryId: null,
      createdAt: now,
      updatedAt: now,
    }))
    await this.storage.saveSlots(slots)

    return { shelf, slots }
  }

  async update(shelf: Shelf): Promise<Shelf> {
    const updated: Shelf = { ...shelf, updatedAt: nowIso() }
    return this.storage.saveShelf(updated)
  }

  async delete(id: string): Promise<void> {
    await this.storage.deleteSlotsByShelf(id)
    await this.storage.deleteShelf(id)
  }
}
