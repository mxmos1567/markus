import type { MediaAsset, MediaKind } from '../domain/models'
import { getDb } from '../db/database'
import { createId, nowIso } from '../utils/id'

const BLOB_URL_CACHE = new Map<string, string>()

function kindFromMime(mime: string): MediaKind {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  return 'document'
}

function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith('image/')) return Promise.resolve(null)
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

export class MediaRepository {
  async list(memoryId: string): Promise<MediaAsset[]> {
    const db = await getDb()
    const assets = await db.getAllFromIndex('media', 'memoryId', memoryId)
    return assets.sort((a, b) => a.order - b.order)
  }

  async upload(memoryId: string, file: File, order: number): Promise<MediaAsset> {
    const db = await getDb()
    const dimensions = await readImageDimensions(file)
    const asset: MediaAsset = {
      id: createId(),
      memoryId,
      kind: kindFromMime(file.type),
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      blobKey: createId(),
      width: dimensions?.width,
      height: dimensions?.height,
      order,
      createdAt: nowIso(),
    }
    await db.put('mediaBlobs', file, asset.blobKey)
    await db.put('media', asset)
    return asset
  }

  async getUrl(asset: MediaAsset): Promise<string> {
    const cached = BLOB_URL_CACHE.get(asset.blobKey)
    if (cached) return cached
    const db = await getDb()
    const blob = await db.get('mediaBlobs', asset.blobKey)
    if (!blob) return ''
    const url = URL.createObjectURL(blob)
    BLOB_URL_CACHE.set(asset.blobKey, url)
    return url
  }

  async delete(id: string): Promise<void> {
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
}
