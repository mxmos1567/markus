import { useState } from 'react'
import type { ResolvedMedia } from '../../hooks/useMediaAssets'
import { Lightbox } from './Lightbox'

export function MediaGallery({ items }: { items: ResolvedMedia[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const visual = items.filter((item) => item.asset.kind !== 'document')
  const documents = items.filter((item) => item.asset.kind === 'document')

  if (items.length === 0) return null

  return (
    <div className="space-y-8">
      {visual.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {visual.map((item, index) => (
            <button
              key={item.asset.id}
              onClick={() => setOpenIndex(index)}
              className="group relative aspect-square overflow-hidden rounded-sm border border-line/60 bg-midnight"
            >
              {item.asset.kind === 'video' ? (
                <video src={item.url} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" muted />
              ) : (
                <img
                  src={item.url}
                  alt={item.asset.fileName}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              {item.asset.kind === 'video' && (
                <span className="absolute inset-0 flex items-center justify-center text-2xl text-warmwhite/90 opacity-90">
                  ▶
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <ul className="space-y-2 text-sm">
          {documents.map((item) => (
            <li key={item.asset.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                download={item.asset.fileName}
                className="inline-flex items-center gap-2 text-mutedgray transition-colors hover:text-gold-soft"
              >
                <span aria-hidden>📄</span> {item.asset.fileName}
              </a>
            </li>
          ))}
        </ul>
      )}

      {openIndex !== null && (
        <Lightbox items={visual} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
      )}
    </div>
  )
}
