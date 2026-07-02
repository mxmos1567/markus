import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Shelf } from '../../domain/models'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'
import { Button } from '../../components/common/Button'

export function ShelvesPage() {
  const { shelves } = useServices()
  const [list, setList] = useState<Shelf[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [rows, setRows] = useState(5)
  const [columns, setColumns] = useState(5)
  const [submitting, setSubmitting] = useState(false)

  function refresh() {
    shelves.list().then((result) => {
      setList(result)
      setLoading(false)
    })
  }

  useEffect(refresh, [shelves])

  async function onCreate(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await shelves.create({ name, rows, columns })
      setName('')
      setRows(5)
      setColumns(5)
      setShowForm(false)
      refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <SerifHeading className="text-3xl">Shelves</SerifHeading>
        <Button onClick={() => setShowForm((value) => !value)}>{showForm ? 'Cancel' : 'New Shelf'}</Button>
      </div>

      {showForm && (
        <form onSubmit={onCreate} className="glass-panel space-y-4 rounded-sm p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Name</label>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Rows</label>
              <input
                type="number"
                min={1}
                max={26}
                required
                value={rows}
                onChange={(event) => setRows(Number(event.target.value))}
                className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Columns</label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={columns}
                onChange={(event) => setColumns(Number(event.target.value))}
                className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-mutedgray">
            This will generate {rows * columns} slots ({rows} rows × {columns} columns), labeled from A1.
          </p>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Shelf'}
          </Button>
        </form>
      )}

      {loading ? (
        <p className="text-mutedgray">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-mutedgray">No shelves yet. Create your first one above.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((shelf) => (
            <Link
              key={shelf.id}
              to={`/admin/shelves/${shelf.id}`}
              className="glass-panel rounded-sm p-5 transition-colors hover:border-gold/40"
            >
              <p className="font-display text-xl">{shelf.name}</p>
              <p className="mt-3 text-xs uppercase tracking-wide text-mutedgray">
                {shelf.rows} × {shelf.columns} · /{shelf.slug}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
