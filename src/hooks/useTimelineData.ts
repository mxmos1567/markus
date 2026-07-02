import { useEffect, useMemo, useState } from 'react'
import type { Memory, Shelf, ShelfSlot } from '../domain/models'
import { useServices } from '../context/ServiceContext'
import { monthLabelOf, yearOf } from '../utils/date'

export interface TimelineEntry {
  memory: Memory
  slot: ShelfSlot
  shelf: Shelf
}

export interface TimelineFilters {
  year: string | null
  month: string | null
}

export function useTimelineData() {
  const { memories, slots, shelves } = useServices()
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
      const slotByMemoryId = new Map(
        allSlots.filter((slot) => slot.memoryId).map((slot) => [slot.memoryId as string, slot]),
      )

      const result: TimelineEntry[] = []
      for (const memory of allMemories) {
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
  }, [memories, slots, shelves])

  const filterOptions = useMemo(() => {
    const years = new Set<string>()
    const months = new Set<string>()
    for (const entry of entries) {
      years.add(String(yearOf(entry.memory.date)))
      months.add(monthLabelOf(entry.memory.date))
    }
    return {
      years: Array.from(years).sort((a, b) => Number(b) - Number(a)),
      months: Array.from(months),
    }
  }, [entries])

  return { entries, loading, filterOptions }
}

export function applyTimelineFilters(entries: TimelineEntry[], filters: TimelineFilters): TimelineEntry[] {
  return entries.filter((entry) => {
    if (filters.year && String(yearOf(entry.memory.date)) !== filters.year) return false
    if (filters.month && monthLabelOf(entry.memory.date) !== filters.month) return false
    return true
  })
}
