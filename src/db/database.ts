import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Memory, MediaAsset } from '../domain/models'

interface MemoryShelfDB extends DBSchema {
  memories: { key: string; value: Memory; indexes: { slug: string } }
  media: { key: string; value: MediaAsset; indexes: { memoryId: string } }
  mediaBlobs: { key: string; value: Blob }
  settings: { key: string; value: unknown }
}

const DB_NAME = 'memory-shelf'
const DB_VERSION = 1

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
      upgrade(db) {
        const memories = db.createObjectStore('memories', { keyPath: 'id' })
        memories.createIndex('slug', 'slug', { unique: true })

        const media = db.createObjectStore('media', { keyPath: 'id' })
        media.createIndex('memoryId', 'memoryId')

        db.createObjectStore('mediaBlobs')
        db.createObjectStore('settings')
      },
    })
  }
  return dbPromise
}

export type { MemoryShelfDB }
