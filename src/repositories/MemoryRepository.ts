import type { CreateMemoryInput, Memory } from '../domain/models'
import { getDb } from '../db/database'
import { createId, nowIso } from '../utils/id'

export class MemoryRepository {
  async list(): Promise<Memory[]> {
    const db = await getDb()
    return db.getAll('memories')
  }

  async get(id: string): Promise<Memory | null> {
    const db = await getDb()
    return (await db.get('memories', id)) ?? null
  }

  async create(input: CreateMemoryInput): Promise<Memory> {
    const db = await getDb()
    const now = nowIso()
    const memory: Memory = {
      id: createId(),
      title: input.title,
      date: input.date,
      description: input.description,
      slotId: null,
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

  async setSlot(memoryId: string, slotId: string | null): Promise<Memory> {
    const db = await getDb()
    const memory = await db.get('memories', memoryId)
    if (!memory) throw new Error(`Memory ${memoryId} not found`)
    const updated: Memory = { ...memory, slotId, updatedAt: nowIso() }
    await db.put('memories', updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(['memories', 'media', 'mediaBlobs', 'slots'], 'readwrite')
    const memory = await tx.objectStore('memories').get(id)
    const assets = await tx.objectStore('media').index('memoryId').getAll(id)

    const ops: Promise<unknown>[] = [
      tx.objectStore('memories').delete(id),
      ...assets.map((asset) => tx.objectStore('media').delete(asset.id)),
      ...assets.map((asset) => tx.objectStore('mediaBlobs').delete(asset.blobKey)),
    ]

    if (memory?.slotId) {
      const slot = await tx.objectStore('slots').get(memory.slotId)
      if (slot) ops.push(tx.objectStore('slots').put({ ...slot, memoryId: null, updatedAt: nowIso() }))
    }

    await Promise.all(ops)
    await tx.done
  }

  async listSorted(): Promise<Memory[]> {
    const memories = await this.list()
    return memories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}
