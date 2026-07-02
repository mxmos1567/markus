import type { ShelfSlot } from '../../domain/models'
import { columnLabel } from '../../domain/models'

const STATUS_CLASSES: Record<ShelfSlot['status'], string> = {
  free: 'border-line text-mutedgray',
  occupied: 'border-gold/70 bg-gold/10 text-gold-soft',
  reserved: 'border-violet text-mutedgray bg-violet/20',
}

export function ShelfGrid({
  rows,
  columns,
  slots,
  onSelect,
}: {
  rows: number
  columns: number
  slots: ShelfSlot[]
  onSelect?: (slot: ShelfSlot) => void
}) {
  const byCode = new Map(slots.map((slot) => [slot.code, slot]))

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: rows }).flatMap((_, r) =>
        Array.from({ length: columns }).map((_, c) => {
          const code = `${columnLabel(r)}${c + 1}`
          const slot = byCode.get(code)
          return (
            <button
              key={code}
              type="button"
              disabled={!slot || !onSelect}
              onClick={() => slot && onSelect?.(slot)}
              className={`aspect-square rounded-sm border text-[11px] transition-colors ${
                slot ? STATUS_CLASSES[slot.status] : 'border-line/30 text-line'
              } ${onSelect ? 'hover:border-gold cursor-pointer' : ''}`}
            >
              {code}
            </button>
          )
        }),
      )}
    </div>
  )
}
