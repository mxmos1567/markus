import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Memory } from '../../domain/models'
import { useMediaAssets } from '../../hooks/useMediaAssets'
import { formatMemoryDate } from '../../utils/date'
import { MediaGallery } from './MediaGallery'
import { SerifHeading } from '../common/SerifHeading'
import { GoldDivider } from '../common/GoldDivider'
import { TimelineLink } from '../common/TimelineLink'

export function MemoryView({ memory }: { memory: Memory }) {
  const { items, loading } = useMediaAssets(memory.id)
  const cover = items.find((item) => item.asset.kind === 'image')

  return (
    <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      {cover && (
        <div className="animate-fade-in mb-12 -mx-6 md:mx-0 md:rounded-sm overflow-hidden border border-line/60">
          <img src={cover.url} alt={memory.title} className="max-h-[70vh] w-full object-cover" />
        </div>
      )}

      <header className="animate-fade-up space-y-3 text-center">
        {memory.favorite && <p className="text-xs uppercase tracking-[0.3em] text-gold">Favorite Memory</p>}
        <SerifHeading className="text-4xl md:text-6xl">{memory.title}</SerifHeading>
        {memory.subtitle && <p className="text-lg text-mutedgray italic">{memory.subtitle}</p>}
        <p className="text-sm uppercase tracking-[0.2em] text-mutedgray/80">
          {formatMemoryDate(memory.date, memory.dateRange)}
        </p>
      </header>

      <GoldDivider className="mx-auto my-10 w-24" />

      {memory.description && (
        <div className="animate-fade-up prose prose-invert prose-p:text-warmwhite/90 prose-headings:font-display max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{memory.description}</ReactMarkdown>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="mt-12">
          <MediaGallery items={items} />
        </div>
      )}

      {memory.location && (
        <p className="mt-10 text-center text-sm text-mutedgray">
          <a
            href={`https://www.openstreetmap.org/?mlat=${memory.location.lat}&mlon=${memory.location.lng}#map=14/${memory.location.lat}/${memory.location.lng}`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-gold-soft transition-colors"
          >
            {memory.location.label ?? `${memory.location.lat.toFixed(4)}, ${memory.location.lng.toFixed(4)}`}
          </a>
        </p>
      )}

      {memory.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {memory.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line px-3 py-1 text-xs uppercase tracking-wide text-mutedgray"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <footer className="mt-16 flex justify-center">
        <TimelineLink />
      </footer>
    </article>
  )
}
