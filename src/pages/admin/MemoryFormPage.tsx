import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'
import { Button } from '../../components/common/Button'
import { GoldDivider } from '../../components/common/GoldDivider'
import { MemoryMediaManager } from '../../components/admin/MemoryMediaManager'
import { QrCodeService } from '../../services/QrCodeService'

const EMPTY_STATE = {
  title: '',
  date: new Date().toISOString().slice(0, 10),
  description: '',
}

export function MemoryFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { memories } = useServices()

  const [memoryId, setMemoryId] = useState<string | null>(isNew ? null : id ?? null)
  const [slug, setSlug] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_STATE)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    if (isNew || !id) return
    memories.get(id).then((memory) => {
      if (!memory) return
      setForm({ title: memory.title, date: memory.date.slice(0, 10), description: memory.description })
      setSlug(memory.slug)
      setLoading(false)
    })
  }, [id, isNew, memories])

  useEffect(() => {
    if (!slug) {
      setQrUrl(null)
      return
    }
    QrCodeService.toDataUrl(slug).then(setQrUrl)
  }, [slug])

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
        setSlug(created.slug)
        navigate(`/admin/memories/${created.id}`, { replace: true })
      }
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!memoryId) return
    if (!confirm('Delete this memory and its QR code link? This cannot be undone.')) return
    await memories.delete(memoryId)
    navigate('/admin/memories')
  }

  function downloadQr() {
    if (!qrUrl || !slug) return
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `${slug}.png`
    link.click()
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
              Public Link & QR Code
            </SerifHeading>
            <div className="glass-panel flex flex-wrap items-center gap-6 rounded-sm p-6">
              {qrUrl && <img src={qrUrl} alt="QR code" className="w-32 bg-white p-1" />}
              <div className="space-y-2 text-sm">
                <p className="text-mutedgray">
                  <a
                    href={`/memory/${slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gold-soft hover:underline"
                  >
                    {typeof window !== 'undefined' ? window.location.origin : ''}/memory/{slug}
                  </a>
                </p>
                <Button variant="ghost" onClick={downloadQr}>
                  Download QR Code
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {!memoryId && <p className="text-sm text-mutedgray">Save the memory first to upload media and get its QR code.</p>}
    </div>
  )
}
