import { useEffect, useState } from 'react'
import type { MediaAsset } from '../domain/models'
import { useServices } from '../context/ServiceContext'

export interface ResolvedMedia {
  asset: MediaAsset
  url: string
}

export function useMediaAssets(memoryId: string | null | undefined) {
  const { media } = useServices()
  const [items, setItems] = useState<ResolvedMedia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!memoryId) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    media.list(memoryId).then(async (assets) => {
      const resolved = await Promise.all(
        assets.map(async (asset) => ({ asset, url: await media.getUrl(asset) })),
      )
      if (!cancelled) {
        setItems(resolved)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [media, memoryId])

  return { items, loading }
}
