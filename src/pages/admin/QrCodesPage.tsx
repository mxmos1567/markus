import { useEffect, useState } from 'react'
import type { Memory } from '../../domain/models'
import { useServices } from '../../context/ServiceContext'
import { QrCodeService } from '../../services/QrCodeService'
import { SerifHeading } from '../../components/common/SerifHeading'
import { Button } from '../../components/common/Button'

export function QrCodesPage() {
  const { memories } = useServices()
  const [list, setList] = useState<Memory[]>([])
  const [images, setImages] = useState<Record<string, string>>({})

  useEffect(() => {
    memories.listSorted().then(setList)
  }, [memories])

  useEffect(() => {
    let cancelled = false
    async function generate() {
      const entries = await Promise.all(
        list.map(async (memory) => [memory.id, await QrCodeService.toDataUrl(memory.slug)] as const),
      )
      if (!cancelled) setImages(Object.fromEntries(entries))
    }
    generate()
    return () => {
      cancelled = true
    }
  }, [list])

  function downloadOne(memory: Memory) {
    const url = images[memory.id]
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = `${memory.slug}.png`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <SerifHeading className="text-3xl">QR Codes</SerifHeading>
        <Button variant="ghost" onClick={() => window.print()}>
          Print All
        </Button>
      </div>

      {list.length === 0 ? (
        <p className="text-mutedgray">No memories yet — create one to get its QR code.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {list.map((memory) => (
            <div key={memory.id} className="glass-panel rounded-sm p-4 text-center">
              {images[memory.id] ? (
                <img
                  src={images[memory.id]}
                  alt={`QR for ${memory.title}`}
                  className="mx-auto mb-2 w-full max-w-[140px] bg-white p-1"
                />
              ) : (
                <div className="mb-2 aspect-square w-full max-w-[140px] mx-auto bg-line/30" />
              )}
              <p className="truncate font-display text-lg">{memory.title}</p>
              <button
                onClick={() => downloadOne(memory)}
                className="text-xs text-mutedgray hover:text-gold-soft print:hidden"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
