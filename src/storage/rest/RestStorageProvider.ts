import type { BackupPayload, IStorageProvider, ImportMode } from '../IStorageProvider'
import type { Memory, MediaAsset, PublicUser, Shelf, ShelfSlot, User } from '../../domain/models'
import { AUTH_TOKEN_STORAGE_KEY } from '../authTokenKey'

interface RestStorageProviderOptions {
  baseUrl: string
  getAuthToken?: () => string | null
}

/**
 * Talks to a REST backend (e.g. the Cloudflare Worker in /worker) that
 * exposes the exact same resources as the IndexedDB provider. Swapping
 * from IndexedDbStorageProvider to this one is a one-line change in
 * StorageProviderFactory — no UI or repository code changes.
 */
export class RestStorageProvider implements IStorageProvider {
  readonly name = 'rest'
  private readonly baseUrl: string
  private readonly getAuthToken: () => string | null

  constructor(options: RestStorageProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.getAuthToken = options.getAuthToken ?? (() => null)
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = this.getAuthToken()
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })
    if (!response.ok) {
      throw new Error(`Request failed: ${init?.method ?? 'GET'} ${path} (${response.status})`)
    }
    if (response.status === 204) return undefined as T
    return (await response.json()) as T
  }

  async init(): Promise<void> {
    await this.request('/health')
  }

  // Shelves
  listShelves(): Promise<Shelf[]> {
    return this.request('/shelves')
  }
  getShelf(id: string): Promise<Shelf | null> {
    return this.request(`/shelves/${id}`)
  }
  getShelfBySlug(slug: string): Promise<Shelf | null> {
    return this.request(`/shelves/by-slug/${slug}`)
  }
  saveShelf(shelf: Shelf): Promise<Shelf> {
    return this.request(`/shelves/${shelf.id}`, { method: 'PUT', body: JSON.stringify(shelf) })
  }
  deleteShelf(id: string): Promise<void> {
    return this.request(`/shelves/${id}`, { method: 'DELETE' })
  }

  // Slots
  listSlots(shelfId?: string): Promise<ShelfSlot[]> {
    return this.request(`/slots${shelfId ? `?shelfId=${shelfId}` : ''}`)
  }
  getSlot(id: string): Promise<ShelfSlot | null> {
    return this.request(`/slots/${id}`)
  }
  getSlotByCode(shelfSlug: string, code: string): Promise<ShelfSlot | null> {
    return this.request(`/slots/by-code/${shelfSlug}/${code}`)
  }
  saveSlots(slots: ShelfSlot[]): Promise<ShelfSlot[]> {
    return this.request('/slots/batch', { method: 'PUT', body: JSON.stringify(slots) })
  }
  deleteSlotsByShelf(shelfId: string): Promise<void> {
    return this.request(`/slots?shelfId=${shelfId}`, { method: 'DELETE' })
  }

  // Memories
  listMemories(): Promise<Memory[]> {
    return this.request('/memories')
  }
  getMemory(id: string): Promise<Memory | null> {
    return this.request(`/memories/${id}`)
  }
  saveMemory(memory: Memory): Promise<Memory> {
    return this.request(`/memories/${memory.id}`, { method: 'PUT', body: JSON.stringify(memory) })
  }
  deleteMemory(id: string): Promise<void> {
    return this.request(`/memories/${id}`, { method: 'DELETE' })
  }

  // Media
  listMedia(memoryId: string): Promise<MediaAsset[]> {
    return this.request(`/media?memoryId=${memoryId}`)
  }
  async saveMediaAsset(asset: MediaAsset, blob: Blob): Promise<MediaAsset> {
    const form = new FormData()
    form.append('asset', JSON.stringify(asset))
    form.append('file', blob, asset.fileName)
    const token = this.getAuthToken()
    const response = await fetch(`${this.baseUrl}/media`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    })
    if (!response.ok) throw new Error(`Media upload failed (${response.status})`)
    return (await response.json()) as MediaAsset
  }
  async getMediaUrl(asset: MediaAsset): Promise<string> {
    return `${this.baseUrl}/media/${asset.id}/blob`
  }
  deleteMediaAsset(id: string): Promise<void> {
    return this.request(`/media/${id}`, { method: 'DELETE' })
  }

  // Users
  listUsers(): Promise<User[]> {
    return this.request('/users')
  }
  getUser(id: string): Promise<User | null> {
    return this.request(`/users/${id}`)
  }
  getUserByUsername(username: string): Promise<User | null> {
    return this.request(`/users/by-username/${username}`)
  }
  saveUser(user: User): Promise<User> {
    return this.request(`/users/${user.id}`, { method: 'PUT', body: JSON.stringify(user) })
  }
  deleteUser(id: string): Promise<void> {
    return this.request(`/users/${id}`, { method: 'DELETE' })
  }

  /**
   * Verifies credentials server-side via /auth/login and stores the
   * returned bearer token — the password itself is the only credential
   * sent over the wire, never a stored hash.
   */
  async verifyCredentials(username: string, password: string): Promise<PublicUser | null> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!response.ok) return null
    const { token, session } = (await response.json()) as { token: string; session: PublicUser }
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
    return session
  }

  // Settings
  getSetting<T>(key: string): Promise<T | null> {
    return this.request(`/settings/${key}`)
  }
  setSetting<T>(key: string, value: T): Promise<void> {
    return this.request(`/settings/${key}`, { method: 'PUT', body: JSON.stringify(value) })
  }

  // Backup / restore
  exportAll(): Promise<BackupPayload> {
    return this.request('/backup/export')
  }
  importAll(payload: BackupPayload, mode: ImportMode): Promise<void> {
    return this.request(`/backup/import?mode=${mode}`, { method: 'POST', body: JSON.stringify(payload) })
  }
}
