import { useEffect, useState } from 'react'
import { useServices } from '../../context/ServiceContext'
import { useAuth } from '../../context/AuthContext'
import { SerifHeading } from '../../components/common/SerifHeading'
import { GoldDivider } from '../../components/common/GoldDivider'
import { Button } from '../../components/common/Button'

interface SiteSettings {
  title: string
  tagline: string
}

const DEFAULT_SETTINGS: SiteSettings = { title: 'Memory Shelf', tagline: 'A digital museum for personal memories.' }

export function SettingsPage() {
  const { storage, users } = useServices()
  const { session } = useAuth()
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    storage.getSetting<SiteSettings>('site').then((value) => {
      if (value) setSettings(value)
    })
  }, [storage])

  async function onSaveSettings(event: React.FormEvent) {
    event.preventDefault()
    await storage.setSetting('site', settings)
    setStatus('Settings saved.')
  }

  async function onChangePassword(event: React.FormEvent) {
    event.preventDefault()
    if (!session || !password) return
    await users.setPassword(session.userId, password)
    setPassword('')
    setStatus('Password updated.')
  }

  return (
    <div className="max-w-2xl space-y-8">
      <SerifHeading className="text-3xl">Settings</SerifHeading>

      <form onSubmit={onSaveSettings} className="glass-panel space-y-4 rounded-sm p-6">
        <h2 className="font-display text-xl">Archive Identity</h2>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Title</label>
          <input
            value={settings.title}
            onChange={(event) => setSettings({ ...settings, title: event.target.value })}
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Tagline</label>
          <input
            value={settings.tagline}
            onChange={(event) => setSettings({ ...settings, tagline: event.target.value })}
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
          />
        </div>
        <Button type="submit">Save</Button>
      </form>

      <GoldDivider />

      <form onSubmit={onChangePassword} className="glass-panel space-y-4 rounded-sm p-6">
        <h2 className="font-display text-xl">Change Your Password</h2>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
        />
        <Button type="submit" disabled={!password}>
          Update Password
        </Button>
      </form>

      {status && <p className="text-sm text-gold-soft">{status}</p>}
    </div>
  )
}
