import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'

interface Counts {
  shelves: number
  slots: number
  freeSlots: number
  memories: number
  favorites: number
}

export function DashboardPage() {
  const { shelves, slots, memories } = useServices()
  const [counts, setCounts] = useState<Counts | null>(null)

  useEffect(() => {
    Promise.all([shelves.list(), slots.list(), memories.list()]).then(([s, sl, m]) => {
      setCounts({
        shelves: s.length,
        slots: sl.length,
        freeSlots: sl.filter((slot) => slot.status === 'free').length,
        memories: m.length,
        favorites: m.filter((memory) => memory.favorite).length,
      })
    })
  }, [shelves, slots, memories])

  return (
    <div className="space-y-8">
      <SerifHeading className="text-3xl">Dashboard</SerifHeading>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Shelves', value: counts?.shelves },
          { label: 'Shelf Slots', value: counts?.slots },
          { label: 'Free Slots', value: counts?.freeSlots },
          { label: 'Memories', value: counts?.memories },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel rounded-sm p-5">
            <p className="text-3xl font-display text-gold-soft">{stat.value ?? '–'}</p>
            <p className="text-xs uppercase tracking-wide text-mutedgray">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link to="/admin/shelves" className="glass-panel rounded-sm p-5 transition-colors hover:border-gold/40">
          <p className="font-display text-xl">Manage Shelves</p>
          <p className="mt-1 text-sm text-mutedgray">Create shelves and generate their slot grids.</p>
        </Link>
        <Link to="/admin/memories" className="glass-panel rounded-sm p-5 transition-colors hover:border-gold/40">
          <p className="font-display text-xl">Add a Memory</p>
          <p className="mt-1 text-sm text-mutedgray">Write a new memory and place it on a shelf.</p>
        </Link>
        <Link to="/admin/qr-codes" className="glass-panel rounded-sm p-5 transition-colors hover:border-gold/40">
          <p className="font-display text-xl">Print QR Codes</p>
          <p className="mt-1 text-sm text-mutedgray">Download codes for every shelf compartment.</p>
        </Link>
      </div>
    </div>
  )
}
