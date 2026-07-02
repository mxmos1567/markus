import type { IStorageProvider } from '../storage/IStorageProvider'
import type { MediaAsset, MediaKind } from '../domain/models'
import { createId, nowIso } from '../utils/id'

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
  private readonly storage: IStorageProvider

  constructor(storage: IStorageProvider) {
    this.storage = storage
  }

  list(memoryId: string): Promise<MediaAsset[]> {
    return this.storage.listMedia(memoryId)
  }

  async upload(memoryId: string, file: File, order: number): Promise<MediaAsset> {
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
    return this.storage.saveMediaAsset(asset, file)
  }

  getUrl(asset: MediaAsset): Promise<string> {
    return this.storage.getMediaUrl(asset)
  }

  delete(id: string): Promise<void> {
    return this.storage.deleteMediaAsset(id)
  }
}
