import type { BackupPayload, IStorageProvider, ImportMode } from '../IStorageProvider'
import type { Memory, MediaAsset, PublicUser, Shelf, ShelfSlot, User } from '../../domain/models'
import { toPublicUser } from '../../domain/models'
import { getDb } from './db'
import { blobToDataUrl, dataUrlToBlob } from '../../utils/blob'
import { PasswordHasher } from '../../services/PasswordHasher'

const BLOB_URL_CACHE = new Map<string, string>()

/**
 * Default storage backend: everything lives in the browser's IndexedDB,
 * including media blobs. This makes Memory Shelf fully offline-capable
 * out of the box, with no server required.
 */
export class IndexedDbStorageProvider implements IStorageProvider {
  readonly name = 'indexeddb'

  async init(): Promise<void> {
    await getDb()
  }

  // Shelves
  async listShelves(): Promise<Shelf[]> {
    const db = await getDb()
    return db.getAll('shelves')
  }

  async getShelf(id: string): Promise<Shelf | null> {
    const db = await getDb()
    return (await db.get('shelves', id)) ?? null
  }

  async getShelfBySlug(slug: string): Promise<Shelf | null> {
    const db = await getDb()
    return (await db.getFromIndex('shelves', 'slug', slug)) ?? null
  }

  async saveShelf(shelf: Shelf): Promise<Shelf> {
    const db = await getDb()
    await db.put('shelves', shelf)
    return shelf
  }

  async deleteShelf(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('shelves', id)
  }

  // Slots
  async listSlots(shelfId?: string): Promise<ShelfSlot[]> {
    const db = await getDb()
    if (shelfId) return db.getAllFromIndex('slots', 'shelfId', shelfId)
    return db.getAll('slots')
  }

  async getSlot(id: string): Promise<ShelfSlot | null> {
    const db = await getDb()
    return (await db.get('slots', id)) ?? null
  }

  async getSlotByCode(shelfSlug: string, code: string): Promise<ShelfSlot | null> {
    const db = await getDb()
    return (await db.getFromIndex('slots', 'shelfSlugCode', [shelfSlug, code])) ?? null
  }

  async saveSlots(slots: ShelfSlot[]): Promise<ShelfSlot[]> {
    const db = await getDb()
    const tx = db.transaction('slots', 'readwrite')
    await Promise.all(slots.map((slot) => tx.store.put(slot)))
    await tx.done
    return slots
  }

  async deleteSlotsByShelf(shelfId: string): Promise<void> {
    const db = await getDb()
    const tx = db.transaction('slots', 'readwrite')
    const index = tx.store.index('shelfId')
    let cursor = await index.openCursor(IDBKeyRange.only(shelfId))
    while (cursor) {
      await cursor.delete()
      cursor = await cursor.continue()
    }
    await tx.done
  }

  // Memories
  async listMemories(): Promise<Memory[]> {
    const db = await getDb()
    return db.getAll('memories')
  }

  async getMemory(id: string): Promise<Memory | null> {
    const db = await getDb()
    return (await db.get('memories', id)) ?? null
  }

  async saveMemory(memory: Memory): Promise<Memory> {
    const db = await getDb()
    await db.put('memories', memory)
    return memory
  }

  async deleteMemory(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('memories', id)
    const assets = await this.listMedia(id)
    await Promise.all(assets.map((asset) => this.deleteMediaAsset(asset.id)))
  }

  // Media
  async listMedia(memoryId: string): Promise<MediaAsset[]> {
    const db = await getDb()
    const assets = await db.getAllFromIndex('media', 'memoryId', memoryId)
    return assets.sort((a, b) => a.order - b.order)
  }

  async saveMediaAsset(asset: MediaAsset, blob: Blob): Promise<MediaAsset> {
    const db = await getDb()
    await db.put('mediaBlobs', blob, asset.blobKey)
    await db.put('media', asset)
    return asset
  }

  async getMediaUrl(asset: MediaAsset): Promise<string> {
    const cached = BLOB_URL_CACHE.get(asset.blobKey)
    if (cached) return cached
    const db = await getDb()
    const blob = await db.get('mediaBlobs', asset.blobKey)
    if (!blob) return ''
    const url = URL.createObjectURL(blob)
    BLOB_URL_CACHE.set(asset.blobKey, url)
    return url
  }

  async deleteMediaAsset(id: string): Promise<void> {
    const db = await getDb()
    const asset = await db.get('media', id)
    if (!asset) return
    const cached = BLOB_URL_CACHE.get(asset.blobKey)
    if (cached) {
      URL.revokeObjectURL(cached)
      BLOB_URL_CACHE.delete(asset.blobKey)
    }
    await db.delete('mediaBlobs', asset.blobKey)
    await db.delete('media', id)
  }

  // Users
  async listUsers(): Promise<User[]> {
    const db = await getDb()
    return db.getAll('users')
  }

  async getUser(id: string): Promise<User | null> {
    const db = await getDb()
    return (await db.get('users', id)) ?? null
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const db = await getDb()
    return (await db.getFromIndex('users', 'username', username)) ?? null
  }

  async saveUser(user: User): Promise<User> {
    const db = await getDb()
    await db.put('users', user)
    return user
  }

  async deleteUser(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('users', id)
  }

  async verifyCredentials(username: string, password: string): Promise<PublicUser | null> {
    const user = await this.getUserByUsername(username)
    if (!user) return null
    const valid = await PasswordHasher.verify(password, user.passwordHash, user.passwordSalt)
    return valid ? toPublicUser(user) : null
  }

  // Settings
  async getSetting<T>(key: string): Promise<T | null> {
    const db = await getDb()
    const value = await db.get('settings', key)
    return (value as T) ?? null
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    const db = await getDb()
    await db.put('settings', value, key)
  }

  // Backup / restore
  async exportAll(): Promise<BackupPayload> {
    const db = await getDb()
    const [shelves, slots, memories, media, users, settingsKeys] = await Promise.all([
      db.getAll('shelves'),
      db.getAll('slots'),
      db.getAll('memories'),
      db.getAll('media'),
      db.getAll('users'),
      db.getAllKeys('settings'),
    ])
    const settings: Record<string, unknown> = {}
    for (const key of settingsKeys) {
      settings[String(key)] = await db.get('settings', key)
    }
    const mediaBlobs: Record<string, string> = {}
    for (const asset of media) {
      const blob = await db.get('mediaBlobs', asset.blobKey)
      if (blob) mediaBlobs[asset.blobKey] = await blobToDataUrl(blob)
    }
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      shelves,
      slots,
      memories,
      media,
      mediaBlobs,
      users,
      settings,
    }
  }

  async importAll(payload: BackupPayload, mode: ImportMode): Promise<void> {
    const db = await getDb()
    if (mode === 'replace') {
      await Promise.all(
        (['shelves', 'slots', 'memories', 'media', 'mediaBlobs', 'users', 'settings'] as const).map(
          (store) => db.clear(store),
        ),
      )
    }
    for (const [blobKey, dataUrl] of Object.entries(payload.mediaBlobs ?? {})) {
      const blob = await dataUrlToBlob(dataUrl)
      await db.put('mediaBlobs', blob, blobKey)
    }
    const tx = db.transaction(['shelves', 'slots', 'memories', 'media', 'users', 'settings'], 'readwrite')
    await Promise.all([
      ...payload.shelves.map((s) => tx.objectStore('shelves').put(s)),
      ...payload.slots.map((s) => tx.objectStore('slots').put(s)),
      ...payload.memories.map((m) => tx.objectStore('memories').put(m)),
      ...payload.media.map((m) => tx.objectStore('media').put(m)),
      ...payload.users.map((u) => tx.objectStore('users').put(u)),
      ...Object.entries(payload.settings).map(([key, value]) => tx.objectStore('settings').put(value, key)),
    ])
    await tx.done
  }
}
