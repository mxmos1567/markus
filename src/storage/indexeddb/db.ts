import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Memory, MediaAsset, Shelf, ShelfSlot, User } from '../../domain/models'

interface MemoryShelfDB extends DBSchema {
  shelves: { key: string; value: Shelf; indexes: { slug: string } }
  slots: {
    key: string
    value: ShelfSlot
    indexes: { shelfId: string; shelfSlugCode: [string, string] }
  }
  memories: { key: string; value: Memory }
  media: { key: string; value: MediaAsset; indexes: { memoryId: string } }
  mediaBlobs: { key: string; value: Blob }
  users: { key: string; value: User; indexes: { username: string } }
  settings: { key: string; value: unknown }
}

const DB_NAME = 'memory-shelf'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<MemoryShelfDB>> | null = null

export function getDb(): Promise<IDBPDatabase<MemoryShelfDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MemoryShelfDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const shelves = db.createObjectStore('shelves', { keyPath: 'id' })
        shelves.createIndex('slug', 'slug', { unique: true })

        const slots = db.createObjectStore('slots', { keyPath: 'id' })
        slots.createIndex('shelfId', 'shelfId')
        slots.createIndex('shelfSlugCode', ['shelfSlug', 'code'], { unique: true })

        db.createObjectStore('memories', { keyPath: 'id' })

        const media = db.createObjectStore('media', { keyPath: 'id' })
        media.createIndex('memoryId', 'memoryId')

        db.createObjectStore('mediaBlobs')

        const users = db.createObjectStore('users', { keyPath: 'id' })
        users.createIndex('username', 'username', { unique: true })

        db.createObjectStore('settings')
      },
    })
  }
  return dbPromise
}

export type { MemoryShelfDB }
