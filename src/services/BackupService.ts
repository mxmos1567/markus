import type { BackupPayload, IStorageProvider, ImportMode } from '../storage/IStorageProvider'

export class BackupService {
  private readonly storage: IStorageProvider

  constructor(storage: IStorageProvider) {
    this.storage = storage
  }

  async exportToFile(): Promise<void> {
    const payload = await this.storage.exportAll()
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
    if (typeof payload.version !== 'number' || !Array.isArray(payload.shelves)) {
      throw new Error('This file does not look like a Memory Shelf backup.')
    }
    await this.storage.importAll(payload, mode)
  }
}
