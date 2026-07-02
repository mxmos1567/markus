import { useEffect, useState } from 'react'
import type { Shelf, ShelfSlot } from '../../domain/models'
import { useServices } from '../../context/ServiceContext'
import { QrCodeService } from '../../services/QrCodeService'
import { SerifHeading } from '../../components/common/SerifHeading'
import { Button } from '../../components/common/Button'

export function QrCodesPage() {
  const { shelves, slots } = useServices()
  const [shelfList, setShelfList] = useState<Shelf[]>([])
  const [shelfId, setShelfId] = useState('')
  const [slotList, setSlotList] = useState<ShelfSlot[]>([])
  const [images, setImages] = useState<Record<string, string>>({})

  useEffect(() => {
    shelves.list().then((list) => {
      setShelfList(list)
      if (list.length > 0) setShelfId(list[0].id)
    })
  }, [shelves])

  useEffect(() => {
    if (!shelfId) return
    slots.list(shelfId).then((list) => setSlotList(list.sort((a, b) => a.code.localeCompare(b.code))))
  }, [shelfId, slots])

  const shelf = shelfList.find((s) => s.id === shelfId)

  useEffect(() => {
    if (!shelf) return
    let cancelled = false
    async function generate() {
      const entries = await Promise.all(
        slotList.map(async (slot) => [slot.id, await QrCodeService.toDataUrl(shelf!.slug, slot.code)] as const),
      )
      if (!cancelled) setImages(Object.fromEntries(entries))
    }
    generate()
    return () => {
      cancelled = true
    }
  }, [shelf, slotList])

  function downloadOne(slot: ShelfSlot) {
    const url = images[slot.id]
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = `${shelf?.slug}-${slot.code}.png`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <SerifHeading className="text-3xl">QR Codes</SerifHeading>
        <Button variant="ghost" onClick={() => window.print()}>
          Print This Shelf
        </Button>
      </div>

      <select
        value={shelfId}
        onChange={(event) => setShelfId(event.target.value)}
        className="rounded-sm border border-line bg-transparent px-3 py-2 text-sm focus:border-gold focus:outline-none print:hidden"
      >
        {shelfList.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {slotList.map((slot) => (
          <div key={slot.id} className="glass-panel rounded-sm p-4 text-center">
            {images[slot.id] ? (
              <img src={images[slot.id]} alt={`QR for ${slot.code}`} className="mx-auto mb-2 w-full max-w-[140px] bg-white p-1" />
            ) : (
              <div className="mb-2 aspect-square w-full max-w-[140px] mx-auto bg-line/30" />
            )}
            <p className="font-display text-lg">{slot.code}</p>
            <p className="mb-2 text-[10px] uppercase text-mutedgray">{slot.status}</p>
            <button
              onClick={() => downloadOne(slot)}
              className="text-xs text-mutedgray hover:text-gold-soft print:hidden"
            >
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
