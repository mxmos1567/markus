import type { Shelf, ShelfSlot } from '../../domain/models'
import { SerifHeading } from '../../components/common/SerifHeading'
import { GoldDivider } from '../../components/common/GoldDivider'
import { TimelineLink } from '../../components/common/TimelineLink'

export function EmptySlotPage({ shelf, slot }: { shelf: Shelf; slot: ShelfSlot }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="animate-fade-in space-y-6">
        <p className="text-xs uppercase tracking-[0.35em] text-mutedgray">
          {shelf.name} · {slot.code}
        </p>
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-sm border border-line/70">
          <span className="text-3xl text-line">◌</span>
        </div>
        <SerifHeading as="h1" className="text-3xl md:text-4xl">
          This compartment is waiting for its memory.
        </SerifHeading>
        <p className="mx-auto max-w-sm text-sm text-mutedgray">
          Nothing has been placed here yet. Return another time — this exact shelf slot will one day hold something
          worth discovering.
        </p>
        <GoldDivider className="mx-auto w-16" />
        <TimelineLink className="justify-center" />
      </div>
    </div>
  )
}
