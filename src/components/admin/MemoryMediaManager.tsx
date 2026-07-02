import { useEffect, useState } from 'react'
import { useServices } from '../../context/ServiceContext'
import { useMediaAssets } from '../../hooks/useMediaAssets'
import { Dropzone } from './Dropzone'

export function MemoryMediaManager({ memoryId }: { memoryId: string }) {
  const { media } = useServices()
  const { items, loading } = useMediaAssets(memoryId)
  const [localItems, setLocalItems] = useState(items)
  const [uploading, setUploading] = useState(false)

  useEffect(() => setLocalItems(items), [items])

  async function handleFiles(files: File[]) {
    setUploading(true)
    try {
      let order = localItems.length
      for (const file of files) {
        const asset = await media.upload(memoryId, file, order++)
        const url = await media.getUrl(asset)
        setLocalItems((prev) => [...prev, { asset, url }])
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    await media.delete(id)
    setLocalItems((prev) => prev.filter((item) => item.asset.id !== id))
  }

  return (
    <div className="space-y-4">
      <Dropzone onFiles={handleFiles} />
      {uploading && <p className="text-xs text-mutedgray">Uploading…</p>}
      {!loading && localItems.length > 0 && (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
          {localItems.map((item) => (
            <div key={item.asset.id} className="group relative aspect-square overflow-hidden rounded-sm border border-line">
              {item.asset.kind === 'image' ? (
                <img src={item.url} alt={item.asset.fileName} className="h-full w-full object-cover" />
              ) : item.asset.kind === 'video' ? (
                <video src={item.url} className="h-full w-full object-cover" muted />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">📄</div>
              )}
              <button
                type="button"
                onClick={() => handleDelete(item.asset.id)}
                className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-void-deep/80 text-xs text-red-300 group-hover:flex"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
