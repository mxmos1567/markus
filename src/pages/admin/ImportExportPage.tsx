import { useRef, useState } from 'react'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'
import { GoldDivider } from '../../components/common/GoldDivider'
import { Button } from '../../components/common/Button'
import type { ImportMode } from '../../services/BackupService'

export function ImportExportPage() {
  const { backup } = useServices()
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<ImportMode>('merge')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onExport() {
    setBusy(true)
    setStatus(null)
    try {
      await backup.exportToFile()
      setStatus('Backup downloaded.')
    } finally {
      setBusy(false)
    }
  }

  async function onImport(file: File) {
    setBusy(true)
    setStatus(null)
    try {
      await backup.importFromFile(file, mode)
      setStatus('Import complete. Reload the app to see the restored archive.')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <SerifHeading className="text-3xl">Import / Export / Backup</SerifHeading>

      <div className="glass-panel space-y-4 rounded-sm p-6">
        <h2 className="font-display text-xl">Export a Backup</h2>
        <p className="text-sm text-mutedgray">
          Downloads every shelf, slot, memory and media file as a single self-contained JSON file — safe to store
          for decades, independent of this app.
        </p>
        <Button onClick={onExport} disabled={busy}>
          Export Full Backup
        </Button>
      </div>

      <GoldDivider />

      <div className="glass-panel space-y-4 rounded-sm p-6">
        <h2 className="font-display text-xl">Restore from Backup</h2>
        <div className="flex gap-4 text-sm text-mutedgray">
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === 'merge'} onChange={() => setMode('merge')} />
            Merge with existing archive
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} />
            Replace everything
          </label>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onImport(file)
            event.target.value = ''
          }}
        />
        <Button variant="ghost" onClick={() => inputRef.current?.click()} disabled={busy}>
          Choose Backup File…
        </Button>
      </div>

      {status && <p className="text-sm text-gold-soft">{status}</p>}
    </div>
  )
}
