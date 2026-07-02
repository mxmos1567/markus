import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Memory, Shelf, ShelfSlot } from '../../domain/models'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'

export function SlotsPage() {
  const { shelves, slots: slotRepo, memories } = useServices()
  const [shelfList, setShelfList] = useState<Shelf[]>([])
  const [slots, setSlots] = useState<ShelfSlot[]>([])
  const [memoryTitles, setMemoryTitles] = useState<Record<string, string>>({})
  const [shelfFilter, setShelfFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    shelves.list().then(setShelfList)
    slotRepo.list().then(setSlots)
    memories.list().then((all: Memory[]) => {
      const map: Record<string, string> = {}
      all.forEach((memory) => {
        map[memory.id] = memory.title
      })
      setMemoryTitles(map)
    })
  }, [shelves, slotRepo, memories])

  const shelfById = new Map(shelfList.map((shelf) => [shelf.id, shelf]))

  const filtered = slots.filter((slot) => {
    if (shelfFilter && slot.shelfId !== shelfFilter) return false
    if (statusFilter && slot.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <SerifHeading className="text-3xl">Shelf Slots</SerifHeading>

      <div className="flex flex-wrap gap-3 text-sm">
        <select
          value={shelfFilter}
          onChange={(event) => setShelfFilter(event.target.value)}
          className="rounded-sm border border-line bg-transparent px-3 py-1.5 focus:border-gold focus:outline-none"
        >
          <option value="">All shelves</option>
          {shelfList.map((shelf) => (
            <option key={shelf.id} value={shelf.id}>
              {shelf.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-sm border border-line bg-transparent px-3 py-1.5 focus:border-gold focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="free">Free</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
        </select>
      </div>

      <div className="glass-panel overflow-x-auto rounded-sm">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-mutedgray">
            <tr>
              <th className="px-4 py-3">Shelf</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Memory</th>
              <th className="px-4 py-3">Link</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((slot) => {
              const shelf = shelfById.get(slot.shelfId)
              return (
                <tr key={slot.id} className="border-t border-line/40">
                  <td className="px-4 py-3">{shelf?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-display text-base">{slot.code}</td>
                  <td className="px-4 py-3 capitalize text-mutedgray">{slot.status}</td>
                  <td className="px-4 py-3">
                    {slot.memoryId ? (
                      <Link to={`/admin/memories/${slot.memoryId}`} className="text-gold-soft hover:underline">
                        {memoryTitles[slot.memoryId] ?? '…'}
                      </Link>
                    ) : (
                      <span className="text-mutedgray">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-mutedgray">
                    {shelf && (
                      <a href={`/slot/${shelf.slug}/${slot.code}`} target="_blank" rel="noreferrer" className="hover:text-gold-soft">
                        /slot/{shelf.slug}/{slot.code}
                      </a>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
