import { useState } from 'react'
import { useServices } from '../../context/ServiceContext'
import { SerifHeading } from '../../components/common/SerifHeading'
import { Button } from '../../components/common/Button'

export function SettingsPage() {
  const { auth } = useServices()
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  async function onChangePassword(event: React.FormEvent) {
    event.preventDefault()
    if (!password) return
    await auth.changePassword(password)
    setPassword('')
    setStatus('Password updated.')
  }

  return (
    <div className="max-w-2xl space-y-8">
      <SerifHeading className="text-3xl">Settings</SerifHeading>

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
