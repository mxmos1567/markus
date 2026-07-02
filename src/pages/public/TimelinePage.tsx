import { useState } from 'react'
import { applyTimelineFilters, useTimelineData, type TimelineFilters } from '../../hooks/useTimelineData'
import { TimelineFiltersBar } from '../../components/timeline/TimelineFilters'
import { TimelineEntry } from '../../components/timeline/TimelineEntry'
import { SerifHeading } from '../../components/common/SerifHeading'
import { GoldDivider } from '../../components/common/GoldDivider'
import { LoadingScreen } from '../../components/common/LoadingScreen'

const EMPTY_FILTERS: TimelineFilters = { year: null, month: null, tag: null, shelfId: null }

export function TimelinePage() {
  const { entries, loading, filterOptions } = useTimelineData()
  const [filters, setFilters] = useState<TimelineFilters>(EMPTY_FILTERS)

  if (loading) return <LoadingScreen />

  const filtered = applyTimelineFilters(entries, filters)

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <header className="animate-fade-in mb-14 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">The Story So Far</p>
        <SerifHeading className="mt-3 text-5xl md:text-6xl">Timeline</SerifHeading>
        <GoldDivider className="mx-auto my-8 w-24" />
        <TimelineFiltersBar filters={filters} options={filterOptions} onChange={setFilters} />
      </header>

      {filtered.length === 0 ? (
        <p className="text-center text-mutedgray">No memories match these filters yet.</p>
      ) : (
        <div className="space-y-24">
          {filtered.map((entry, index) => (
            <TimelineEntry key={entry.memory.id} entry={entry} reversed={index % 2 === 1} />
          ))}
        </div>
      )}
    </div>
  )
}
