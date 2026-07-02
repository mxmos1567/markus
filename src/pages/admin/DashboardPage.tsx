import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'
import { ThisMonthWidget } from '../../components/admin/ThisMonthWidget'

export function DashboardPage() {
  const { shelves, slots, memories } = useServices()
  const [counts, setCounts] = useState<{ shelves: number; freeSlots: number; memories: number } | null>(null)

  useEffect(() => {
    Promise.all([shelves.list(), slots.list(), memories.list()]).then(([s, sl, m]) => {
      setCounts({ shelves: s.length, freeSlots: sl.filter((slot) => !slot.memoryId).length, memories: m.length })
    })
  }, [shelves, slots, memories])

  return (
    <div className="space-y-8">
      <SerifHeading className="text-3xl">Dashboard</SerifHeading>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {[
          { label: 'Shelves', value: counts?.shelves },
          { label: 'Free Slots', value: counts?.freeSlots },
          { label: 'Memories', value: counts?.memories },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel rounded-sm p-5">
            <p className="text-3xl font-display text-gold-soft">{stat.value ?? '–'}</p>
            <p className="text-xs uppercase tracking-wide text-mutedgray">{stat.label}</p>
          </div>
        ))}
      </div>

      <ThisMonthWidget />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link to="/admin/shelves" className="glass-panel rounded-sm p-5 transition-colors hover:border-gold/40">
          <p className="font-display text-xl">Manage Shelves</p>
          <p className="mt-1 text-sm text-mutedgray">Create shelves and generate their slot grids.</p>
        </Link>
        <Link to="/admin/memories/new" className="glass-panel rounded-sm p-5 transition-colors hover:border-gold/40">
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
