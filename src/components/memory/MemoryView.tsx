import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Memory } from '../../domain/models'
import { useMediaAssets } from '../../hooks/useMediaAssets'
import { formatDate } from '../../utils/date'
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
        <SerifHeading className="text-4xl md:text-6xl">{memory.title}</SerifHeading>
        <p className="text-sm uppercase tracking-[0.2em] text-mutedgray/80">{formatDate(memory.date)}</p>
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

      <footer className="mt-16 flex justify-center">
        <TimelineLink />
      </footer>
    </article>
  )
}
