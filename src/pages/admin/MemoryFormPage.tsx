import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { DateRange, GeoLocation, ShelfSlot, Visibility } from '../../domain/models'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'
import { Button } from '../../components/common/Button'
import { GoldDivider } from '../../components/common/GoldDivider'
import { SlotAssignment } from '../../components/admin/SlotAssignment'
import { MemoryMediaManager } from '../../components/admin/MemoryMediaManager'

const EMPTY_STATE = {
  title: '',
  subtitle: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  hasRange: false,
  rangeEnd: '',
  tags: '',
  notes: '',
  favorite: false,
  visibility: 'public' as Visibility,
  lat: '',
  lng: '',
  locationLabel: '',
}

export function MemoryFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { memories, slots } = useServices()

  const [memoryId, setMemoryId] = useState<string | null>(isNew ? null : id ?? null)
  const [form, setForm] = useState(EMPTY_STATE)
  const [currentSlot, setCurrentSlot] = useState<ShelfSlot | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew || !id) return
    memories.get(id).then(async (memory) => {
      if (!memory) return
      setForm({
        title: memory.title,
        subtitle: memory.subtitle,
        description: memory.description,
        date: memory.date.slice(0, 10),
        hasRange: !!memory.dateRange,
        rangeEnd: memory.dateRange?.end?.slice(0, 10) ?? '',
        tags: memory.tags.join(', '),
        notes: memory.notes,
        favorite: memory.favorite,
        visibility: memory.visibility,
        lat: memory.location ? String(memory.location.lat) : '',
        lng: memory.location ? String(memory.location.lng) : '',
        locationLabel: memory.location?.label ?? '',
      })
      if (memory.slotId) {
        const slot = await slots.get(memory.slotId)
        setCurrentSlot(slot)
      }
      setLoading(false)
    })
  }, [id, isNew, memories, slots])

  function buildInput() {
    const dateRange: DateRange | null = form.hasRange && form.rangeEnd ? { start: form.date, end: form.rangeEnd } : null
    const location: GeoLocation | null =
      form.lat && form.lng
        ? { lat: parseFloat(form.lat), lng: parseFloat(form.lng), label: form.locationLabel || undefined }
        : null
    const tags = form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
    return {
      title: form.title,
      subtitle: form.subtitle,
      description: form.description,
      date: form.date,
      dateRange,
      location,
      tags,
      notes: form.notes,
      favorite: form.favorite,
      visibility: form.visibility,
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      if (memoryId) {
        const existing = await memories.get(memoryId)
        if (existing) await memories.update({ ...existing, ...buildInput() })
      } else {
        const created = await memories.create(buildInput())
        setMemoryId(created.id)
        navigate(`/admin/memories/${created.id}`, { replace: true })
      }
    } finally {
      setSaving(false)
    }
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
    <div className="max-w-3xl space-y-8">
      <SerifHeading className="text-3xl">{isNew ? 'New Memory' : 'Edit Memory'}</SerifHeading>

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
          <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Subtitle</label>
          <input
            value={form.subtitle}
            onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Description (Markdown)</label>
          <textarea
            rows={8}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 font-mono text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-mutedgray">
              <input
                type="checkbox"
                checked={form.hasRange}
                onChange={(event) => setForm({ ...form, hasRange: event.target.checked })}
              />
              Date range
            </label>
            {form.hasRange && (
              <input
                type="date"
                value={form.rangeEnd}
                onChange={(event) => setForm({ ...form, rangeEnd: event.target.value })}
                className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
              />
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Tags (comma separated)</label>
          <input
            value={form.tags}
            onChange={(event) => setForm({ ...form, tags: event.target.value })}
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Latitude</label>
            <input
              value={form.lat}
              onChange={(event) => setForm({ ...form, lat: event.target.value })}
              className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Longitude</label>
            <input
              value={form.lng}
              onChange={(event) => setForm({ ...form, lng: event.target.value })}
              className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Location label</label>
            <input
              value={form.locationLabel}
              onChange={(event) => setForm({ ...form, locationLabel: event.target.value })}
              className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Private notes (admin only)</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-mutedgray">
            <input
              type="checkbox"
              checked={form.favorite}
              onChange={(event) => setForm({ ...form, favorite: event.target.checked })}
            />
            Favorite
          </label>
          <label className="flex items-center gap-2 text-sm text-mutedgray">
            Visibility
            <select
              value={form.visibility}
              onChange={(event) => setForm({ ...form, visibility: event.target.value as Visibility })}
              className="rounded-sm border border-line bg-transparent px-2 py-1 focus:border-gold focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
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
