import { useEffect, useState } from 'react'
import type { Memory } from '../domain/models'
import { useServices } from '../context/ServiceContext'
import { monthOf, yearOf } from '../utils/date'

export interface ThisMonthEntry {
  memory: Memory
  coverUrl: string | null
}

/**
 * Memories whose calendar month matches the current month, regardless
 * of year or whether the exact day is known. This deliberately ignores
 * the day — most memories only carry a month, not an exact date.
 */
export function useThisMonthMemories() {
  const { memories, media } = useServices()
  const [entries, setEntries] = useState<ThisMonthEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const all = await memories.list()
      const currentMonth = new Date().getMonth() + 1
      const matches = all
        .filter((memory) => monthOf(memory.date) === currentMonth)
        .sort((a, b) => yearOf(b.date) - yearOf(a.date))

      const withCovers = await Promise.all(
        matches.map(async (memory) => {
          const assets = await media.list(memory.id)
          const cover = assets.find((asset) => asset.kind === 'image')
          const coverUrl = cover ? await media.getUrl(cover) : null
          return { memory, coverUrl }
        }),
      )

      if (!cancelled) {
        setEntries(withCovers)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [memories, media])

  return { entries, loading }
}
