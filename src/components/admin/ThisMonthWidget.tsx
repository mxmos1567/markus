import { Link } from 'react-router-dom'
import { useThisMonthMemories } from '../../hooks/useThisMonthMemories'
import { monthLabelOf, yearsAgo, yearOf } from '../../utils/date'

const CURRENT_MONTH_NAME = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date())

export function ThisMonthWidget() {
  const { entries, loading } = useThisMonthMemories()

  return (
    <div className="glass-panel rounded-sm p-6">
      <p className="mb-4 font-display text-xl">This Month in Memories</p>

      {loading ? (
        <p className="text-sm text-mutedgray">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-mutedgray">No memories from {CURRENT_MONTH_NAME} yet.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {entries.map(({ memory, coverUrl }) => (
            <Link
              key={memory.id}
              to={`/admin/memories/${memory.id}`}
              className="flex items-center gap-3 rounded-sm border border-line/60 p-3 transition-colors hover:border-gold/40"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-line/60 bg-midnight">
                {coverUrl && <img src={coverUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-warmwhite">{memory.title}</p>
                <p className="text-xs text-mutedgray">
                  {monthLabelOf(memory.date)} · {yearsAgo(yearOf(memory.date))}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
