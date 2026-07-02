import type { IStorageProvider } from './IStorageProvider'
import { IndexedDbStorageProvider } from './indexeddb/IndexedDbStorageProvider'
import { RestStorageProvider } from './rest/RestStorageProvider'
import { AUTH_TOKEN_STORAGE_KEY } from './authTokenKey'

let instance: IStorageProvider | null = null

/**
 * Single place that decides which backend the app talks to. Set
 * VITE_STORAGE_PROVIDER=rest and VITE_API_BASE_URL to point Memory Shelf
 * at a Cloudflare Worker (or any other REST backend) instead of the
 * browser's local IndexedDB. Nothing else in the app needs to change.
 */
export function createStorageProvider(): IStorageProvider {
  if (instance) return instance

  const kind = import.meta.env.VITE_STORAGE_PROVIDER ?? 'indexeddb'

  if (kind === 'rest') {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'
    instance = new RestStorageProvider({
      baseUrl,
      getAuthToken: () => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
    })
  } else {
    instance = new IndexedDbStorageProvider()
  }

  return instance
}
