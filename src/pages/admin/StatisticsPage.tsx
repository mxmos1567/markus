import { useEffect, useState } from 'react'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'

interface Stats {
  shelves: number
  slots: number
  free: number
  occupied: number
  reserved: number
  memories: number
  publicMemories: number
  privateMemories: number
  favorites: number
  tags: number
  media: number
}

export function StatisticsPage() {
  const { shelves, slots, memories, media } = useServices()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    async function load() {
      const [shelfList, slotList, memoryList] = await Promise.all([shelves.list(), slots.list(), memories.list()])
      let mediaCount = 0
      for (const memory of memoryList) {
        mediaCount += (await media.list(memory.id)).length
      }
      const tags = new Set(memoryList.flatMap((memory) => memory.tags))
      setStats({
        shelves: shelfList.length,
        slots: slotList.length,
        free: slotList.filter((s) => s.status === 'free').length,
        occupied: slotList.filter((s) => s.status === 'occupied').length,
        reserved: slotList.filter((s) => s.status === 'reserved').length,
        memories: memoryList.length,
        publicMemories: memoryList.filter((m) => m.visibility === 'public').length,
        privateMemories: memoryList.filter((m) => m.visibility === 'private').length,
        favorites: memoryList.filter((m) => m.favorite).length,
        tags: tags.size,
        media: mediaCount,
      })
    }
    load()
  }, [shelves, slots, memories, media])

  const tiles = stats
    ? [
        { label: 'Shelves', value: stats.shelves },
        { label: 'Total Slots', value: stats.slots },
        { label: 'Free Slots', value: stats.free },
        { label: 'Occupied Slots', value: stats.occupied },
        { label: 'Reserved Slots', value: stats.reserved },
        { label: 'Memories', value: stats.memories },
        { label: 'Public', value: stats.publicMemories },
        { label: 'Private', value: stats.privateMemories },
        { label: 'Favorites', value: stats.favorites },
        { label: 'Unique Tags', value: stats.tags },
        { label: 'Media Files', value: stats.media },
      ]
    : []

  return (
    <div className="space-y-8">
      <SerifHeading className="text-3xl">Statistics</SerifHeading>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="glass-panel rounded-sm p-5">
            <p className="text-3xl font-display text-gold-soft">{tile.value}</p>
            <p className="text-xs uppercase tracking-wide text-mutedgray">{tile.label}</p>
          </div>
        ))}
        {!stats && <p className="text-mutedgray">Loading…</p>}
      </div>
    </div>
  )
}
