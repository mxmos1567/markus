import { useEffect, useState } from 'react'
import { useServices } from '../../context/ServiceContext'
import { QrCodeService } from '../../services/QrCodeService'
import { SerifHeading } from '../../components/common/SerifHeading'
import { GoldDivider } from '../../components/common/GoldDivider'
import { Button } from '../../components/common/Button'

export function SettingsPage() {
  const { auth } = useServices()
  const [password, setPassword] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    QrCodeService.getBaseUrl().then(setBaseUrl)
  }, [])

  async function onChangePassword(event: React.FormEvent) {
    event.preventDefault()
    if (!password) return
    await auth.changePassword(password)
    setPassword('')
    setStatus('Password updated.')
  }

  async function onSaveBaseUrl(event: React.FormEvent) {
    event.preventDefault()
    await QrCodeService.setBaseUrl(baseUrl)
    setBaseUrl(await QrCodeService.getBaseUrl())
    setStatus('QR Code Base URL saved. Newly generated QR codes will use it.')
  }

  return (
    <div className="max-w-2xl space-y-8">
      <SerifHeading className="text-3xl">Settings</SerifHeading>

      <form onSubmit={onSaveBaseUrl} className="glass-panel space-y-4 rounded-sm p-6">
        <h2 className="font-display text-xl">QR Code Base URL</h2>
        <p className="text-sm text-mutedgray">
          Where printed QR codes should point. Use this if Memory Shelf is hosted locally — e.g. on a Raspberry Pi
          on your home network — instead of a public domain.
        </p>
        <input
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="http://erinnerungsregal.local"
          className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
        />
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
