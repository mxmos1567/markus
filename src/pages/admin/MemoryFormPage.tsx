import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ShelfSlot } from '../../domain/models'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'
import { Button } from '../../components/common/Button'
import { GoldDivider } from '../../components/common/GoldDivider'
import { MemoryMediaManager } from '../../components/admin/MemoryMediaManager'
import { SlotAssignment } from '../../components/admin/SlotAssignment'

const EMPTY_STATE = {
  title: '',
  date: new Date().toISOString().slice(0, 10),
  description: '',
}

export function MemoryFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { memories, slots } = useServices()

  const [memoryId, setMemoryId] = useState<string | null>(isNew ? null : id ?? null)
  const [currentSlot, setCurrentSlot] = useState<ShelfSlot | null>(null)
  const [form, setForm] = useState(EMPTY_STATE)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew || !id) return
    memories.get(id).then(async (memory) => {
      if (!memory) return
      setForm({ title: memory.title, date: memory.date.slice(0, 10), description: memory.description })
      if (memory.slotId) setCurrentSlot(await slots.get(memory.slotId))
      setLoading(false)
    })
  }, [id, isNew, memories, slots])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      if (memoryId) {
        const existing = await memories.get(memoryId)
        if (existing) await memories.update({ ...existing, ...form })
      } else {
        const created = await memories.create(form)
        setMemoryId(created.id)
        navigate(`/admin/memories/${created.id}`, { replace: true })
      }
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!memoryId) return
    if (!confirm('Delete this memory? Its shelf slot will become free again. This cannot be undone.')) return
    await memories.delete(memoryId)
    navigate('/admin/memories')
  }

  async function onAssign(slot: ShelfSlot) {
    if (!memoryId) return
    await slots.assignMemory(slot.id, memoryId, currentSlot?.id)
    await memories.setSlot(memoryId, slot.id)
    setCurrentSlot(slot)
  }

  async function onRelease() {
    if (!memoryId || !currentSlot) return
    await slots.release(currentSlot.id)
    await memories.setSlot(memoryId, null)
    setCurrentSlot(null)
  }

  if (loading) return <p className="text-mutedgray">Loading…</p>

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <SerifHeading className="text-3xl">{isNew ? 'New Memory' : 'Edit Memory'}</SerifHeading>
        {memoryId && (
          <Button variant="danger" onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>

      <form onSubmit={onSubmit} className="glass-panel space-y-5 rounded-sm p-6">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Title</label>
          <input
            required
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Date</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            className="w-full max-w-xs rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Story (Markdown)</label>
          <textarea
            rows={10}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 font-mono text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Memory'}
        </Button>
      </form>

      {memoryId && (
        <>
          <div>
            <GoldDivider className="mb-6" />
            <SerifHeading as="h2" className="mb-4 text-2xl">
              Media
            </SerifHeading>
            <MemoryMediaManager memoryId={memoryId} />
          </div>

          <div>
            <GoldDivider className="mb-6" />
            <SerifHeading as="h2" className="mb-4 text-2xl">
              Shelf Placement
            </SerifHeading>
            <SlotAssignment currentSlot={currentSlot} onAssign={onAssign} onRelease={onRelease} />
          </div>
        </>
      )}

      {!memoryId && (
        <p className="text-sm text-mutedgray">Save the memory first to upload media and place it on a shelf.</p>
      )}
    </div>
  )
}
