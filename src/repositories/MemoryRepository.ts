import type { IStorageProvider } from '../storage/IStorageProvider'
import type { CreateMemoryInput, Memory } from '../domain/models'
import { createId, nowIso } from '../utils/id'

export class MemoryRepository {
  private readonly storage: IStorageProvider

  constructor(storage: IStorageProvider) {
    this.storage = storage
  }

  list(): Promise<Memory[]> {
    return this.storage.listMemories()
  }

  get(id: string): Promise<Memory | null> {
    return this.storage.getMemory(id)
  }

  async create(input: CreateMemoryInput): Promise<Memory> {
    const now = nowIso()
    const memory: Memory = {
      id: createId(),
      ...input,
      slotId: null,
      createdAt: now,
      updatedAt: now,
    }
    return this.storage.saveMemory(memory)
  }

  async update(memory: Memory): Promise<Memory> {
    return this.storage.saveMemory({ ...memory, updatedAt: nowIso() })
  }

  async setSlot(memoryId: string, slotId: string | null): Promise<Memory> {
    const memory = await this.storage.getMemory(memoryId)
    if (!memory) throw new Error(`Memory ${memoryId} not found`)
    return this.storage.saveMemory({ ...memory, slotId, updatedAt: nowIso() })
  }

  async delete(id: string): Promise<void> {
    await this.storage.deleteMemory(id)
  }

  async listPublicSorted(): Promise<Memory[]> {
    const memories = await this.storage.listMemories()
    return memories
      .filter((memory) => memory.visibility === 'public')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}
