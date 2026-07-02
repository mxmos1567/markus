import { useEffect, useMemo, useState } from 'react'
import type { Memory } from '../domain/models'
import { useServices } from '../context/ServiceContext'
import { monthLabelOf, yearOf } from '../utils/date'

export interface TimelineFilters {
  year: string | null
  month: string | null
}

export function useTimelineData() {
  const { memories } = useServices()
  const [entries, setEntries] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    memories.listSorted().then((result) => {
      if (!cancelled) {
        setEntries(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [memories])

  const filterOptions = useMemo(() => {
    const years = new Set<string>()
    const months = new Set<string>()
    for (const memory of entries) {
      years.add(String(yearOf(memory.date)))
      months.add(monthLabelOf(memory.date))
    }
    return {
      years: Array.from(years).sort((a, b) => Number(b) - Number(a)),
      months: Array.from(months),
    }
  }, [entries])

  return { entries, loading, filterOptions }
}

export function applyTimelineFilters(entries: Memory[], filters: TimelineFilters): Memory[] {
  return entries.filter((memory) => {
    if (filters.year && String(yearOf(memory.date)) !== filters.year) return false
    if (filters.month && monthLabelOf(memory.date) !== filters.month) return false
    return true
  })
}
