import { useEffect, useState } from 'react'
import type { Shelf, ShelfSlot } from '../../domain/models'
import { useServices } from '../../context/ServiceContext'
import { Button } from '../common/Button'

interface Props {
  currentSlot: ShelfSlot | null
  onAssign: (slot: ShelfSlot) => Promise<void>
  onRelease: () => Promise<void>
}

export function SlotAssignment({ currentSlot, onAssign, onRelease }: Props) {
  const { shelves, slots } = useServices()
  const [shelfList, setShelfList] = useState<Shelf[]>([])
  const [shelfId, setShelfId] = useState('')
  const [mode, setMode] = useState<'manual' | 'random'>('manual')
  const [freeSlots, setFreeSlots] = useState<ShelfSlot[]>([])
  const [manualSlotId, setManualSlotId] = useState('')
  const [randomOffer, setRandomOffer] = useState<ShelfSlot | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    shelves.list().then((list) => {
      setShelfList(list)
      if (list.length > 0 && !shelfId) setShelfId(currentSlot?.shelfId ?? list[0].id)
    })
  }, [shelves, currentSlot, shelfId])

  useEffect(() => {
    if (!shelfId) return
    slots.freeSlots(shelfId).then(setFreeSlots)
    setRandomOffer(null)
    setManualSlotId('')
  }, [shelfId, slots])

  async function rerollRandom() {
    setBusy(true)
    try {
      const offer = await slots.pickRandomFree(shelfId, randomOffer?.id)
      setRandomOffer(offer)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {currentSlot ? (
        <div className="rounded-sm border border-gold/40 bg-gold/5 p-4 text-sm">
          <p>
            Currently placed at <span className="font-display text-lg">{currentSlot.code}</span>
          </p>
          <button type="button" onClick={onRelease} className="mt-2 text-xs text-mutedgray hover:text-red-300">
            Remove from shelf
          </button>
        </div>
      ) : (
        <p className="text-sm text-mutedgray">Not yet placed on any shelf.</p>
      )}

      <div className="flex gap-2 text-xs uppercase tracking-wide">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`rounded-sm border px-3 py-1.5 ${mode === 'manual' ? 'border-gold text-gold-soft' : 'border-line text-mutedgray'}`}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode('random')}
          className={`rounded-sm border px-3 py-1.5 ${mode === 'random' ? 'border-gold text-gold-soft' : 'border-line text-mutedgray'}`}
        >
          Random Free Slot
        </button>
      </div>

      <select
        value={shelfId}
        onChange={(event) => setShelfId(event.target.value)}
        className="w-full rounded-sm border border-line bg-transparent px-3 py-2 text-sm focus:border-gold focus:outline-none"
      >
        {shelfList.map((shelf) => (
          <option key={shelf.id} value={shelf.id}>
            {shelf.name}
          </option>
        ))}
      </select>

      {mode === 'manual' ? (
        <div className="flex gap-3">
          <select
            value={manualSlotId}
            onChange={(event) => setManualSlotId(event.target.value)}
            className="flex-1 rounded-sm border border-line bg-transparent px-3 py-2 text-sm focus:border-gold focus:outline-none"
          >
            <option value="">Choose a free slot…</option>
            {freeSlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.code}
              </option>
            ))}
          </select>
          <Button
            type="button"
            disabled={!manualSlotId || busy}
            onClick={async () => {
              const slot = freeSlots.find((s) => s.id === manualSlotId)
              if (!slot) return
              setBusy(true)
              try {
                await onAssign(slot)
              } finally {
                setBusy(false)
              }
            }}
          >
            Place Here
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {freeSlots.length === 0 ? (
            <p className="text-sm text-mutedgray">No free slots on this shelf.</p>
          ) : (
            <>
              <Button type="button" variant="ghost" disabled={busy} onClick={rerollRandom}>
                {randomOffer ? 'Reroll' : 'Draw a Random Slot'}
              </Button>
              {randomOffer && (
                <div className="flex items-center justify-between rounded-sm border border-line p-3 text-sm">
                  <span>
                    Offered slot: <span className="font-display text-lg">{randomOffer.code}</span>
                  </span>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true)
                      try {
                        await onAssign(randomOffer)
                        setRandomOffer(null)
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    Confirm
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
