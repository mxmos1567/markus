import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'

export function DashboardPage() {
  const { memories } = useServices()
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    memories.list().then((all) => setCount(all.length))
  }, [memories])

  return (
    <div className="space-y-8">
      <SerifHeading className="text-3xl">Dashboard</SerifHeading>

      <div className="glass-panel w-fit rounded-sm p-5">
        <p className="text-3xl font-display text-gold-soft">{count ?? '–'}</p>
        <p className="text-xs uppercase tracking-wide text-mutedgray">Memories</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link to="/admin/memories/new" className="glass-panel rounded-sm p-5 transition-colors hover:border-gold/40">
          <p className="font-display text-xl">Add a Memory</p>
          <p className="mt-1 text-sm text-mutedgray">Write a new memory and get its QR code.</p>
        </Link>
        <Link to="/admin/qr-codes" className="glass-panel rounded-sm p-5 transition-colors hover:border-gold/40">
          <p className="font-display text-xl">Print QR Codes</p>
          <p className="mt-1 text-sm text-mutedgray">Download codes to stick onto your shelf.</p>
        </Link>
        <a
          href="/timeline"
          target="_blank"
          rel="noreferrer"
          className="glass-panel rounded-sm p-5 transition-colors hover:border-gold/40"
        >
          <p className="font-display text-xl">View Timeline</p>
          <p className="mt-1 text-sm text-mutedgray">See what visitors see at /timeline.</p>
        </a>
      </div>
    </div>
  )
}
