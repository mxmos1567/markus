import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Memory, MediaAsset, Shelf, ShelfSlot } from '../domain/models'

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
  settings: { key: string; value: unknown }
}

const DB_NAME = 'memory-shelf'
const DB_VERSION = 2

let dbPromise: Promise<IDBPDatabase<MemoryShelfDB>> | null = null

/**
 * Memory Shelf stores everything locally in the browser's IndexedDB —
 * including media blobs — so the app works fully offline with no
 * backend. This is the one place that talks to IndexedDB directly;
 * repositories in src/repositories/* are the only callers.
 */
export function getDb(): Promise<IDBPDatabase<MemoryShelfDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MemoryShelfDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('media', { keyPath: 'id' }).createIndex('memoryId', 'memoryId')
          db.createObjectStore('mediaBlobs')
          db.createObjectStore('settings')
        }

        // v1 had a `memories` store with a unique `slug` index; the slot
        // system now owns permanent public URLs, so memories no longer
        // have one. Recreate the store without it.
        if (db.objectStoreNames.contains('memories')) {
          db.deleteObjectStore('memories')
        }
        db.createObjectStore('memories', { keyPath: 'id' })

        if (oldVersion < 2) {
          const shelves = db.createObjectStore('shelves', { keyPath: 'id' })
          shelves.createIndex('slug', 'slug', { unique: true })

          const slots = db.createObjectStore('slots', { keyPath: 'id' })
          slots.createIndex('shelfId', 'shelfId')
          slots.createIndex('shelfSlugCode', ['shelfSlug', 'code'], { unique: true })
        }
      },
    })
  }
  return dbPromise
}

export type { MemoryShelfDB }
