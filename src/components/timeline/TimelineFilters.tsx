import type { TimelineFilters } from '../../hooks/useTimelineData'

interface Props {
  filters: TimelineFilters
  options: {
    years: string[]
    months: string[]
  }
  onChange: (filters: TimelineFilters) => void
}

export function TimelineFiltersBar({ filters, options, onChange }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-3 text-sm">
      <select
        value={filters.year ?? ''}
        onChange={(event) => onChange({ ...filters, year: event.target.value || null })}
        className="rounded-sm border border-line bg-transparent px-3 py-1.5 text-mutedgray focus:border-gold focus:outline-none"
      >
        <option value="">All years</option>
        {options.years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      <select
        value={filters.month ?? ''}
        onChange={(event) => onChange({ ...filters, month: event.target.value || null })}
        className="rounded-sm border border-line bg-transparent px-3 py-1.5 text-mutedgray focus:border-gold focus:outline-none"
      >
        <option value="">All months</option>
        {options.months.map((month) => (
          <option key={month} value={month}>
            {month}
          </option>
        ))}
      </select>
    </div>
  )
}
