import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Memory, Shelf, ShelfSlot } from '../../domain/models'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'
import { Button } from '../../components/common/Button'
import { ShelfGrid } from '../../components/admin/ShelfGrid'

export function ShelfDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { shelves, slots: slotRepo, memories } = useServices()
  const [shelf, setShelf] = useState<Shelf | null>(null)
  const [slots, setSlots] = useState<ShelfSlot[]>([])
  const [memoryTitles, setMemoryTitles] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<ShelfSlot | null>(null)
  const [name, setName] = useState('')

  useEffect(() => {
    if (!id) return
    shelves.get(id).then((result) => {
      setShelf(result)
      if (result) setName(result.name)
    })
    slotRepo.list(id).then(setSlots)
  }, [id, shelves, slotRepo])

  useEffect(() => {
    memories.list().then((all: Memory[]) => {
      const map: Record<string, string> = {}
      all.forEach((memory) => {
        map[memory.id] = memory.title
      })
      setMemoryTitles(map)
    })
  }, [memories])

  if (!shelf) return <p className="text-mutedgray">Loading…</p>

  async function onSave(event: React.FormEvent) {
    event.preventDefault()
    if (!shelf) return
    const updated = await shelves.update({ ...shelf, name })
    setShelf(updated)
  }

  async function onDelete() {
    if (!shelf) return
    if (!confirm(`Delete "${shelf.name}" and all its ${slots.length} slots? This cannot be undone.`)) return
    await shelves.delete(shelf.id)
    navigate('/admin/shelves')
  }

  async function onFreeSlot(slot: ShelfSlot) {
    if (!slot.memoryId) return
    await memories.setSlot(slot.memoryId, null)
    const updated = await slotRepo.release(slot.id)
    setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setSelected(updated)
  }

  return (
    <div className="space-y-8">
      <SerifHeading className="text-3xl">{shelf.name}</SerifHeading>

      <form onSubmit={onSave} className="glass-panel flex flex-wrap items-end gap-4 rounded-sm p-6">
        <div className="flex-1">
          <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
          />
        </div>
        <div className="flex gap-3">
          <Button type="submit">Save</Button>
          <Button type="button" variant="danger" onClick={onDelete}>
            Delete Shelf
          </Button>
        </div>
      </form>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        <div className="glass-panel rounded-sm p-6">
          <p className="mb-4 text-xs uppercase tracking-wide text-mutedgray">
            {shelf.rows} × {shelf.columns} slots · /{shelf.slug}
          </p>
          <ShelfGrid rows={shelf.rows} columns={shelf.columns} slots={slots} onSelect={setSelected} />
        </div>

        <div className="glass-panel rounded-sm p-6">
          <p className="mb-3 text-xs uppercase tracking-wide text-mutedgray">Slot detail</p>
          {selected ? (
            <div className="space-y-3 text-sm">
              <p className="font-display text-2xl">{selected.code}</p>
              <p className="text-mutedgray">
                Status: <span className="text-warmwhite">{selected.memoryId ? 'occupied' : 'free'}</span>
              </p>
              {selected.memoryId && (
                <p className="text-mutedgray">
                  Memory: <span className="text-warmwhite">{memoryTitles[selected.memoryId] ?? '…'}</span>
                </p>
              )}
              <p className="break-all text-mutedgray">
                /slot/{shelf.slug}/{selected.code}
              </p>
              {selected.memoryId && (
                <Button variant="ghost" onClick={() => onFreeSlot(selected)}>
                  Free This Slot
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-mutedgray">Select a slot in the grid to see its details.</p>
          )}
        </div>
      </div>
    </div>
  )
}
