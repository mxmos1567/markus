import type { CreateMemoryInput, Memory } from '../domain/models'
import { getDb } from '../db/database'
import { createId, nowIso } from '../utils/id'
import { slugify } from '../utils/slug'

export class MemoryRepository {
  async list(): Promise<Memory[]> {
    const db = await getDb()
    return db.getAll('memories')
  }

  async get(id: string): Promise<Memory | null> {
    const db = await getDb()
    return (await db.get('memories', id)) ?? null
  }

  async getBySlug(slug: string): Promise<Memory | null> {
    const db = await getDb()
    return (await db.getFromIndex('memories', 'slug', slug)) ?? null
  }

  private async uniqueSlug(title: string): Promise<string> {
    const db = await getDb()
    const base = slugify(title) || 'memory'
    let slug = base
    let attempt = 1
    while (await db.getFromIndex('memories', 'slug', slug)) {
      slug = `${base}-${++attempt}`
    }
    return slug
  }

  async create(input: CreateMemoryInput): Promise<Memory> {
    const db = await getDb()
    const now = nowIso()
    const memory: Memory = {
      id: createId(),
      slug: await this.uniqueSlug(input.title),
      title: input.title,
      date: input.date,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    }
    await db.put('memories', memory)
    return memory
  }

  async update(memory: Memory): Promise<Memory> {
    const db = await getDb()
    const updated: Memory = { ...memory, updatedAt: nowIso() }
    await db.put('memories', updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(['memories', 'media', 'mediaBlobs'], 'readwrite')
    const assets = await tx.objectStore('media').index('memoryId').getAll(id)
    await Promise.all([
      tx.objectStore('memories').delete(id),
      ...assets.map((asset) => tx.objectStore('media').delete(asset.id)),
      ...assets.map((asset) => tx.objectStore('mediaBlobs').delete(asset.blobKey)),
    ])
    await tx.done
  }

  async listSorted(): Promise<Memory[]> {
    const memories = await this.list()
    return memories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}
