import { Link } from 'react-router-dom'
import type { Memory } from '../../domain/models'
import { memoryRoute } from '../../domain/models'
import { useMediaAssets } from '../../hooks/useMediaAssets'
import { formatDate } from '../../utils/date'

export function TimelineEntry({ memory, reversed }: { memory: Memory; reversed: boolean }) {
  const { items } = useMediaAssets(memory.id)
  const cover = items.find((item) => item.asset.kind === 'image')

  return (
    <Link
      to={memoryRoute(memory.slug)}
      className={`group grid animate-fade-up grid-cols-1 items-center gap-8 md:grid-cols-2 ${
        reversed ? 'md:[&>*:first-child]:order-2' : ''
      }`}
    >
      <div className="aspect-[4/3] overflow-hidden rounded-sm border border-line/60 bg-midnight">
        {cover ? (
          <img
            src={cover.url}
            alt={memory.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-line">◌</div>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-mutedgray">{formatDate(memory.date)}</p>
        <h3 className="font-display text-3xl text-warmwhite transition-colors group-hover:text-gold-soft">
          {memory.title}
        </h3>
      </div>
    </Link>
  )
}
