import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Shelf, ShelfSlot } from '../../domain/models'
import { useServices } from '../../context/ServiceContext'
import { Button } from '../common/Button'

interface Props {
  currentSlot: ShelfSlot | null
  onAssign: (slot: ShelfSlot) => Promise<void>
  onRelease: () => Promise<void>
}

/**
 * The normal workflow is: assign a memory to a slot once, print its QR
 * code, done. So once a memory already has a slot, this renders as a
 * plain status line — the manual/random assignment controls (and the
 * shelf picker, when there's more than one shelf) only reappear behind
 * an explicit "Move to a different slot" action, confirmed before it
 * takes effect, since moving changes what a QR code already printed and
 * stuck to a shelf will show.
 */
export function SlotAssignment({ currentSlot, onAssign, onRelease }: Props) {
  const { shelves, slots } = useServices()
  const [shelfList, setShelfList] = useState<Shelf[]>([])
  const [shelvesLoaded, setShelvesLoaded] = useState(false)
  const [shelfId, setShelfId] = useState('')
  const [mode, setMode] = useState<'manual' | 'random'>('manual')
  const [freeSlots, setFreeSlots] = useState<ShelfSlot[]>([])
  const [manualSlotId, setManualSlotId] = useState('')
  const [randomOffer, setRandomOffer] = useState<ShelfSlot | null>(null)
  const [busy, setBusy] = useState(false)
  const [reassigning, setReassigning] = useState(false)

  useEffect(() => {
    shelves.list().then((list) => {
      setShelfList(list)
      setShelvesLoaded(true)
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

  async function confirmAndAssign(target: ShelfSlot) {
    if (currentSlot && currentSlot.id !== target.id) {
      const proceed = confirm(
        `Move this memory from ${currentSlot.code} to ${target.code}? The QR code at ${currentSlot.code} will go back to showing an empty shelf.`,
      )
      if (!proceed) return
    }
    setBusy(true)
    try {
      await onAssign(target)
      setReassigning(false)
      setRandomOffer(null)
    } finally {
      setBusy(false)
    }
  }

  async function confirmAndRelease() {
    if (!currentSlot) return
    const proceed = confirm(`Remove this memory from ${currentSlot.code}? That slot's QR code will show as empty.`)
    if (!proceed) return
    await onRelease()
  }

  if (!shelvesLoaded) return <p className="text-sm text-mutedgray">Loading…</p>

  if (shelfList.length === 0) {
    return (
      <p className="text-sm text-mutedgray">
        You'll need a shelf before placing memories.{' '}
        <Link to="/admin/shelves" className="text-gold-soft hover:underline">
          Create one
        </Link>
        .
      </p>
    )
  }

  // Already placed, and not currently choosing a new slot: show status only.
  if (currentSlot && !reassigning) {
    return (
      <div className="rounded-sm border border-gold/40 bg-gold/5 p-4 text-sm">
        <p>
          Currently placed at <span className="font-display text-lg">{currentSlot.code}</span>
        </p>
        <div className="mt-3 flex gap-4 text-xs">
          <button type="button" onClick={() => setReassigning(true)} className="text-mutedgray hover:text-gold-soft">
            Move to a different slot…
          </button>
          <button type="button" onClick={confirmAndRelease} className="text-mutedgray hover:text-red-300">
            Remove from shelf
          </button>
        </div>
      </div>
    )
  }

  const showShelfPicker = shelfList.length > 1

  return (
    <div className="space-y-4">
      {currentSlot && (
        <div className="flex items-center justify-between rounded-sm border border-line p-3 text-sm">
          <span>
            Currently placed at <span className="font-display text-lg">{currentSlot.code}</span>
          </span>
          <button type="button" onClick={() => setReassigning(false)} className="text-xs text-mutedgray hover:text-warmwhite">
            Cancel
          </button>
        </div>
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

      {showShelfPicker && (
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
      )}

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
            onClick={() => {
              const slot = freeSlots.find((s) => s.id === manualSlotId)
              if (slot) confirmAndAssign(slot)
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
                  <Button type="button" disabled={busy} onClick={() => confirmAndAssign(randomOffer)}>
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
