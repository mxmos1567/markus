import { Link } from 'react-router-dom'
import type { TimelineEntry as TimelineEntryData } from '../../hooks/useTimelineData'
import { useMediaAssets } from '../../hooks/useMediaAssets'
import { formatMemoryDate } from '../../utils/date'
import { slotRoute } from '../../domain/models'

export function TimelineEntry({ entry, reversed }: { entry: TimelineEntryData; reversed: boolean }) {
  const { items } = useMediaAssets(entry.memory.id)
  const cover = items.find((item) => item.asset.kind === 'image')

  return (
    <Link
      to={slotRoute(entry.shelf.slug, entry.slot.code)}
      className={`group grid animate-fade-up grid-cols-1 items-center gap-8 md:grid-cols-2 ${
        reversed ? 'md:[&>*:first-child]:order-2' : ''
      }`}
    >
      <div className="aspect-[4/3] overflow-hidden rounded-sm border border-line/60 bg-midnight">
        {cover ? (
          <img
            src={cover.url}
            alt={entry.memory.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-line">◌</div>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-mutedgray">
          {formatMemoryDate(entry.memory.date, entry.memory.dateRange)} · {entry.shelf.name}
        </p>
        <h3 className="font-display text-3xl text-warmwhite transition-colors group-hover:text-gold-soft">
          {entry.memory.title}
        </h3>
        {entry.memory.subtitle && <p className="text-mutedgray italic">{entry.memory.subtitle}</p>}
        {entry.memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {entry.memory.tags.map((tag) => (
              <span key={tag} className="text-[10px] uppercase tracking-wide text-mutedgray/70">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
