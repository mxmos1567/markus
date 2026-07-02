import type { Memory, MediaAsset, PublicUser, Shelf, ShelfSlot, User } from '../domain/models'

export interface BackupPayload {
  version: number
  exportedAt: string
  shelves: Shelf[]
  slots: ShelfSlot[]
  memories: Memory[]
  media: MediaAsset[]
  /** Base64 data URLs keyed by MediaAsset.blobKey, so backups are self-contained. */
  mediaBlobs: Record<string, string>
  users: User[]
  settings: Record<string, unknown>
}

export type ImportMode = 'merge' | 'replace'

/**
 * Storage Provider Pattern: every persistence backend (IndexedDB today,
 * a REST/Cloudflare backend tomorrow) implements this single contract.
 * The rest of the app never talks to a database directly, only to this
 * interface, so the backend can be swapped without touching UI or
 * repository logic.
 */
export interface IStorageProvider {
  readonly name: string

  init(): Promise<void>

  // Shelves
  listShelves(): Promise<Shelf[]>
  getShelf(id: string): Promise<Shelf | null>
  getShelfBySlug(slug: string): Promise<Shelf | null>
  saveShelf(shelf: Shelf): Promise<Shelf>
  deleteShelf(id: string): Promise<void>

  // Slots
  listSlots(shelfId?: string): Promise<ShelfSlot[]>
  getSlot(id: string): Promise<ShelfSlot | null>
  getSlotByCode(shelfSlug: string, code: string): Promise<ShelfSlot | null>
  saveSlots(slots: ShelfSlot[]): Promise<ShelfSlot[]>
  deleteSlotsByShelf(shelfId: string): Promise<void>

  // Memories
  listMemories(): Promise<Memory[]>
  getMemory(id: string): Promise<Memory | null>
  saveMemory(memory: Memory): Promise<Memory>
  deleteMemory(id: string): Promise<void>

  // Media
  listMedia(memoryId: string): Promise<MediaAsset[]>
  saveMediaAsset(asset: MediaAsset, blob: Blob): Promise<MediaAsset>
  getMediaUrl(asset: MediaAsset): Promise<string>
  deleteMediaAsset(id: string): Promise<void>

  // Users
  listUsers(): Promise<User[]>
  getUser(id: string): Promise<User | null>
  getUserByUsername(username: string): Promise<User | null>
  saveUser(user: User): Promise<User>
  deleteUser(id: string): Promise<void>

  /**
   * Verifies a username/password pair and returns the public user on
   * success, or null on failure. Deliberately part of the storage
   * contract (not layered on top of getUserByUsername) so that a
   * server-backed provider can verify credentials server-side and
   * never send a password hash over the wire — the IndexedDB provider
   * verifies locally instead, which is safe only because "the wire" is
   * the same device.
   */
  verifyCredentials(username: string, password: string): Promise<PublicUser | null>

  // Settings
  getSetting<T>(key: string): Promise<T | null>
  setSetting<T>(key: string, value: T): Promise<void>

  // Backup / restore
  exportAll(): Promise<BackupPayload>
  importAll(payload: BackupPayload, mode: ImportMode): Promise<void>
}
