import type { Memory, MediaAsset } from '../domain/models'
import { getDb } from '../db/database'
import { blobToDataUrl, dataUrlToBlob } from '../utils/blob'

export interface BackupPayload {
  version: number
  exportedAt: string
  memories: Memory[]
  media: MediaAsset[]
  /** Base64 data URLs keyed by MediaAsset.blobKey, so backups are self-contained. */
  mediaBlobs: Record<string, string>
  settings: Record<string, unknown>
}

export type ImportMode = 'merge' | 'replace'

export class BackupService {
  async exportToFile(): Promise<void> {
    const db = await getDb()
    const [memories, media, settingsKeys] = await Promise.all([
      db.getAll('memories'),
      db.getAll('media'),
      db.getAllKeys('settings'),
    ])
    const settings: Record<string, unknown> = {}
    for (const key of settingsKeys) {
      settings[String(key)] = await db.get('settings', key)
    }
    const mediaBlobs: Record<string, string> = {}
    for (const asset of media) {
      const blob = await db.get('mediaBlobs', asset.blobKey)
      if (blob) mediaBlobs[asset.blobKey] = await blobToDataUrl(blob)
    }

    const payload: BackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      memories,
      media,
      mediaBlobs,
      settings,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `memory-shelf-backup-${payload.exportedAt.slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async importFromFile(file: File, mode: ImportMode): Promise<void> {
    const text = await file.text()
    const payload = JSON.parse(text) as BackupPayload
    if (typeof payload.version !== 'number' || !Array.isArray(payload.memories)) {
      throw new Error('This file does not look like a Memory Shelf backup.')
    }

    const db = await getDb()
    if (mode === 'replace') {
      await Promise.all(
        (['memories', 'media', 'mediaBlobs', 'settings'] as const).map((store) => db.clear(store)),
      )
    }

    for (const [blobKey, dataUrl] of Object.entries(payload.mediaBlobs ?? {})) {
      const blob = await dataUrlToBlob(dataUrl)
      await db.put('mediaBlobs', blob, blobKey)
    }

    const tx = db.transaction(['memories', 'media', 'settings'], 'readwrite')
    await Promise.all([
      ...payload.memories.map((memory) => tx.objectStore('memories').put(memory)),
      ...payload.media.map((asset) => tx.objectStore('media').put(asset)),
      ...Object.entries(payload.settings ?? {}).map(([key, value]) => tx.objectStore('settings').put(value, key)),
    ])
    await tx.done
  }
}
