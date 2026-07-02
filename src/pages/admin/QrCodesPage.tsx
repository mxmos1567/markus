import { useEffect, useMemo, useState } from 'react'
import type { Memory, Shelf, ShelfSlot } from '../../domain/models'
import { useServices } from '../../context/ServiceContext'
import { QrCodeService } from '../../services/QrCodeService'
import { LABEL_TEMPLATES, getLabelTemplate } from '../../domain/labelTemplates'
import { paginateLabels } from '../../domain/labelLayout'
import { SerifHeading } from '../../components/common/SerifHeading'
import { GoldDivider } from '../../components/common/GoldDivider'
import { Button } from '../../components/common/Button'
import { LabelStartPicker } from '../../components/admin/labels/LabelStartPicker'
import { LabelSheetView, type LabelItem } from '../../components/admin/labels/LabelSheetView'
import { LabelPrintArea } from '../../components/admin/labels/LabelPrintArea'

type ContentMode = 'qr-only' | 'qr-code' | 'qr-title'

export function QrCodesPage() {
  const { shelves, slots, memories } = useServices()
  const [shelfList, setShelfList] = useState<Shelf[]>([])
  const [shelfId, setShelfId] = useState('')
  const [slotList, setSlotList] = useState<ShelfSlot[]>([])
  const [images, setImages] = useState<Record<string, string>>({})
  const [memoryTitles, setMemoryTitles] = useState<Record<string, string>>({})

  const [templateId, setTemplateId] = useState(LABEL_TEMPLATES[0].id)
  const [contentMode, setContentMode] = useState<ContentMode>('qr-only')
  const [startIndex, setStartIndex] = useState(0)

  useEffect(() => {
    shelves.list().then((list) => {
      setShelfList(list)
      if (list.length > 0) setShelfId(list[0].id)
    })
    memories.list().then((all: Memory[]) => {
      const map: Record<string, string> = {}
      all.forEach((memory) => {
        map[memory.id] = memory.title
      })
      setMemoryTitles(map)
    })
  }, [shelves, memories])

  useEffect(() => {
    if (!shelfId) return
    slots
      .list(shelfId)
      .then((list) => setSlotList(list.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))))
    setStartIndex(0)
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

  const template = getLabelTemplate(templateId)

  const labelItems: LabelItem[] = useMemo(() => {
    return slotList
      .filter((slot) => images[slot.id])
      .map((slot) => {
        const memoryTitle = slot.memoryId ? memoryTitles[slot.memoryId] : undefined
        const text =
          contentMode === 'qr-code' ? slot.code : contentMode === 'qr-title' ? memoryTitle ?? slot.code : undefined
        return { qrDataUrl: images[slot.id], text }
      })
  }, [slotList, images, memoryTitles, contentMode])

  const sheets = useMemo(() => paginateLabels(template, startIndex, labelItems), [template, startIndex, labelItems])

  if (shelfList.length === 0) {
    return (
      <div className="space-y-6">
        <SerifHeading className="text-3xl">QR Codes</SerifHeading>
        <p className="text-mutedgray">Create a shelf first to generate QR codes for its slots.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SerifHeading className="text-3xl">QR Codes</SerifHeading>

      <select
        value={shelfId}
        onChange={(event) => setShelfId(event.target.value)}
        className="rounded-sm border border-line bg-transparent px-3 py-2 text-sm focus:border-gold focus:outline-none"
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
              <img
                src={images[slot.id]}
                alt={`QR for ${slot.code}`}
                className="mx-auto mb-2 w-full max-w-[140px] bg-white p-1"
              />
            ) : (
              <div className="mb-2 aspect-square w-full max-w-[140px] mx-auto bg-line/30" />
            )}
            <p className="font-display text-lg">{slot.code}</p>
            <p className="mb-2 text-[10px] uppercase text-mutedgray">{slot.memoryId ? 'occupied' : 'free'}</p>
            <button onClick={() => downloadOne(slot)} className="text-xs text-mutedgray hover:text-gold-soft">
              Download
            </button>
          </div>
        ))}
      </div>

      <GoldDivider />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <SerifHeading as="h2" className="text-2xl">
            Print as Label Sheet
          </SerifHeading>
          <Button variant="ghost" onClick={() => window.print()}>
            Print
          </Button>
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-mutedgray">Label Template</p>
            <select
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
              className="rounded-sm border border-line bg-transparent px-3 py-2 text-sm focus:border-gold focus:outline-none"
            >
              {LABEL_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-mutedgray">Print Content</p>
            <div className="flex gap-4 text-sm text-mutedgray">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={contentMode === 'qr-only'}
                  onChange={() => setContentMode('qr-only')}
                />
                QR code only
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={contentMode === 'qr-code'}
                  onChange={() => setContentMode('qr-code')}
                />
                QR + slot code
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={contentMode === 'qr-title'}
                  onChange={() => setContentMode('qr-title')}
                />
                QR + memory title
              </label>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-mutedgray">
            Reusing a partially used sheet? Click the first free position below — everything before it stays empty.
          </p>
          <LabelStartPicker template={template} startIndex={startIndex} onPick={setStartIndex} />
        </div>

        <div>
          <p className="mb-2 text-sm text-mutedgray">
            Preview ({sheets.length} sheet{sheets.length === 1 ? '' : 's'})
          </p>
          <div className="flex flex-wrap gap-6 overflow-x-auto">
            <LabelPrintArea template={template}>
              {sheets.map((sheet, index) => (
                <LabelSheetView key={index} template={template} cells={sheet} scale={0.42} />
              ))}
            </LabelPrintArea>
          </div>
        </div>
      </div>
    </div>
  )
}
