import { useEffect } from 'react'
import type { ResolvedMedia } from '../../hooks/useMediaAssets'

interface LightboxProps {
  items: ResolvedMedia[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export function Lightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const current = items[index]

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onNavigate((index + 1) % items.length)
      if (event.key === 'ArrowLeft') onNavigate((index - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, items.length, onClose, onNavigate])

  if (!current) return null

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-void-deep/95 p-6"
      onClick={onClose}
    >
      <button
        aria-label="Close"
        className="absolute right-6 top-6 text-2xl text-mutedgray transition-colors hover:text-gold-soft"
        onClick={onClose}
      >
        ×
      </button>

      {items.length > 1 && (
        <>
          <button
            aria-label="Previous"
            className="absolute left-4 text-3xl text-mutedgray transition-colors hover:text-gold-soft md:left-8"
            onClick={(event) => {
              event.stopPropagation()
              onNavigate((index - 1 + items.length) % items.length)
            }}
          >
            ‹
          </button>
          <button
            aria-label="Next"
            className="absolute right-4 text-3xl text-mutedgray transition-colors hover:text-gold-soft md:right-8"
            onClick={(event) => {
              event.stopPropagation()
              onNavigate((index + 1) % items.length)
            }}
          >
            ›
          </button>
        </>
      )}

      <div className="max-h-[85vh] max-w-5xl" onClick={(event) => event.stopPropagation()}>
        {current.asset.kind === 'video' ? (
          <video src={current.url} controls autoPlay className="max-h-[85vh] max-w-full rounded-sm shadow-2xl" />
        ) : (
          <img
            src={current.url}
            alt={current.asset.fileName}
            className="max-h-[85vh] max-w-full rounded-sm object-contain shadow-2xl"
          />
        )}
      </div>
    </div>
  )
}
