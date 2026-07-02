import { createStorageProvider } from '../storage/StorageProviderFactory'
import { ShelfRepository } from '../repositories/ShelfRepository'
import { SlotRepository } from '../repositories/SlotRepository'
import { MemoryRepository } from '../repositories/MemoryRepository'
import { MediaRepository } from '../repositories/MediaRepository'
import { UserRepository } from '../repositories/UserRepository'
import { AuthService } from './AuthService'
import { BackupService } from './BackupService'

/**
 * Composition root: wires the chosen IStorageProvider into every
 * repository and service exactly once. Everything downstream (pages,
 * components) depends on this container, never on a concrete storage
 * implementation.
 */
export class ServiceContainer {
  readonly storage = createStorageProvider()
  readonly shelves = new ShelfRepository(this.storage)
  readonly slots = new SlotRepository(this.storage)
  readonly memories = new MemoryRepository(this.storage)
  readonly media = new MediaRepository(this.storage)
  readonly users = new UserRepository(this.storage)
  readonly auth = new AuthService(this.storage)
  readonly backup = new BackupService(this.storage)

  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.storage.init().then(() => {
        // Only the local IndexedDB backend can safely self-seed: a REST
        // backend requires authentication just to list users, and admin
        // creation there is an explicit deployment step (see worker/README.md).
        if (this.storage.name === 'indexeddb') return this.users.ensureDefaultAdmin()
      })
    }
    return this.initPromise
  }
}

let container: ServiceContainer | null = null

export function getServiceContainer(): ServiceContainer {
  if (!container) container = new ServiceContainer()
  return container
}
