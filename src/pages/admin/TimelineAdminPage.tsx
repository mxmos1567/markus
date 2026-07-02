import { Link } from 'react-router-dom'
import { useTimelineData } from '../../hooks/useTimelineData'
import { SerifHeading } from '../../components/common/SerifHeading'
import { formatMemoryDate } from '../../utils/date'

export function TimelineAdminPage() {
  const { entries, loading } = useTimelineData()

  return (
    <div className="space-y-6">
      <SerifHeading className="text-3xl">Timeline</SerifHeading>
      <p className="text-sm text-mutedgray">
        Every memory currently placed on a shelf, in chronological order. This mirrors what visitors see at{' '}
        <a href="/timeline" target="_blank" rel="noreferrer" className="text-gold-soft hover:underline">
          /timeline
        </a>
        , plus your private memories.
      </p>

      {loading ? (
        <p className="text-mutedgray">Loading…</p>
      ) : (
        <div className="glass-panel divide-y divide-line/40 rounded-sm">
          {entries.map((entry) => (
            <Link
              key={entry.memory.id}
              to={`/admin/memories/${entry.memory.id}`}
              className="flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-violet/10"
            >
              <div>
                <p>{entry.memory.title}</p>
                <p className="text-xs text-mutedgray">
                  {formatMemoryDate(entry.memory.date, entry.memory.dateRange)} · {entry.shelf.name} {entry.slot.code}
                </p>
              </div>
              <span className="text-xs uppercase text-mutedgray">{entry.memory.visibility}</span>
            </Link>
          ))}
          {entries.length === 0 && <p className="px-5 py-4 text-sm text-mutedgray">No memories placed yet.</p>}
        </div>
      )}
    </div>
  )
}
