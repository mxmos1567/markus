import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Memory } from '../../domain/models'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'
import { Button } from '../../components/common/Button'
import { formatMemoryDate } from '../../utils/date'

export function MemoriesPage() {
  const { memories } = useServices()
  const [list, setList] = useState<Memory[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    memories.list().then((all) => {
      setList(all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    })
  }, [memories])

  const filtered = list.filter((memory) => {
    const q = query.toLowerCase()
    return (
      memory.title.toLowerCase().includes(q) ||
      memory.tags.some((tag) => tag.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SerifHeading className="text-3xl">Memories</SerifHeading>
        <Link to="/admin/memories/new">
          <Button>New Memory</Button>
        </Link>
      </div>

      <input
        placeholder="Search by title or tag…"
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
            <p className="mt-1 text-xs uppercase tracking-wide text-mutedgray">
              {formatMemoryDate(memory.date, memory.dateRange)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase text-mutedgray">
              <span className={memory.visibility === 'private' ? 'text-red-300' : ''}>{memory.visibility}</span>
              {memory.favorite && <span className="text-gold">favorite</span>}
              {!memory.slotId && <span className="text-mutedgray/60">unassigned</span>}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-mutedgray">No memories found.</p>}
      </div>
    </div>
  )
}
