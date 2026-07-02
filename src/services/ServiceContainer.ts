import { getDb } from '../db/database'
import { ShelfRepository } from '../repositories/ShelfRepository'
import { SlotRepository } from '../repositories/SlotRepository'
import { MemoryRepository } from '../repositories/MemoryRepository'
import { MediaRepository } from '../repositories/MediaRepository'
import { AuthService } from './AuthService'
import { BackupService } from './BackupService'

/**
 * Composition root: one place that constructs every repository and
 * service, so pages depend on this container rather than reaching into
 * IndexedDB or localStorage themselves.
 */
export class ServiceContainer {
  readonly shelves = new ShelfRepository()
  readonly slots = new SlotRepository()
  readonly memories = new MemoryRepository()
  readonly media = new MediaRepository()
  readonly auth = new AuthService()
  readonly backup = new BackupService()

  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = getDb().then(() => this.auth.ensureAccountExists())
    }
    return this.initPromise
  }
}

let container: ServiceContainer | null = null

export function getServiceContainer(): ServiceContainer {
  if (!container) container = new ServiceContainer()
  return container
}
