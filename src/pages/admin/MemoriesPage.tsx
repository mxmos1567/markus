import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Memory } from '../../domain/models'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'
import { Button } from '../../components/common/Button'
import { formatDate } from '../../utils/date'

export function MemoriesPage() {
  const { memories } = useServices()
  const [list, setList] = useState<Memory[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    memories.listSorted().then(setList)
  }, [memories])

  const filtered = list.filter((memory) => memory.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SerifHeading className="text-3xl">Memories</SerifHeading>
        <Link to="/admin/memories/new">
          <Button>New Memory</Button>
        </Link>
      </div>

      <input
        placeholder="Search by title…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full max-w-sm rounded-sm border border-line bg-transparent px-3 py-2 text-sm focus:border-gold focus:outline-none"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((memory) => (
          <Link
            key={memory.id}
            to={`/admin/memories/${memory.id}`}
            className="glass-panel rounded-sm p-5 transition-colors hover:border-gold/40"
          >
            <p className="font-display text-xl">{memory.title}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-mutedgray">{formatDate(memory.date)}</p>
            {!memory.slotId && <p className="mt-3 text-xs uppercase text-mutedgray/60">Not on a shelf yet</p>}
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-mutedgray">No memories found.</p>}
      </div>
    </div>
  )
}
