import { useEffect, useMemo, useState } from 'react'
import type { Memory, Shelf, ShelfSlot } from '../domain/models'
import { useServices } from '../context/ServiceContext'
import { useAuth } from '../context/AuthContext'
import { monthLabelOf, yearOf } from '../utils/date'

export interface TimelineEntry {
  memory: Memory
  slot: ShelfSlot
  shelf: Shelf
}

export interface TimelineFilters {
  year: string | null
  month: string | null
  tag: string | null
  shelfId: string | null
}

export function useTimelineData() {
  const { memories, slots, shelves } = useServices()
  const { session } = useAuth()
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [allMemories, allSlots, allShelves] = await Promise.all([
        memories.list(),
        slots.list(),
        shelves.list(),
      ])
      const shelfById = new Map(allShelves.map((shelf) => [shelf.id, shelf]))
      const slotByMemoryId = new Map(allSlots.filter((slot) => slot.memoryId).map((slot) => [slot.memoryId as string, slot]))

      const visible = allMemories.filter((memory) => session || memory.visibility === 'public')
      const result: TimelineEntry[] = []
      for (const memory of visible) {
        const slot = slotByMemoryId.get(memory.id)
        if (!slot) continue
        const shelf = shelfById.get(slot.shelfId)
        if (!shelf) continue
        result.push({ memory, slot, shelf })
      }
      result.sort((a, b) => new Date(b.memory.date).getTime() - new Date(a.memory.date).getTime())
      if (!cancelled) {
        setEntries(result)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [memories, slots, shelves, session])

  const filterOptions = useMemo(() => {
    const years = new Set<string>()
    const months = new Set<string>()
    const tags = new Set<string>()
    const shelvesInUse = new Map<string, string>()
    for (const entry of entries) {
      years.add(String(yearOf(entry.memory.date)))
      months.add(monthLabelOf(entry.memory.date))
      entry.memory.tags.forEach((tag) => tags.add(tag))
      shelvesInUse.set(entry.shelf.id, entry.shelf.name)
    }
    return {
      years: Array.from(years).sort((a, b) => Number(b) - Number(a)),
      months: Array.from(months),
      tags: Array.from(tags).sort(),
      shelves: Array.from(shelvesInUse.entries()),
    }
  }, [entries])

  return { entries, loading, filterOptions }
}

export function applyTimelineFilters(entries: TimelineEntry[], filters: TimelineFilters): TimelineEntry[] {
  return entries.filter((entry) => {
    if (filters.year && String(yearOf(entry.memory.date)) !== filters.year) return false
    if (filters.month && monthLabelOf(entry.memory.date) !== filters.month) return false
    if (filters.tag && !entry.memory.tags.includes(filters.tag)) return false
    if (filters.shelfId && entry.shelf.id !== filters.shelfId) return false
    return true
  })
}
