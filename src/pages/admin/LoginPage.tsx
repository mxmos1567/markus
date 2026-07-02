import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { SerifHeading } from '../../components/common/SerifHeading'
import { Button } from '../../components/common/Button'

export function LoginPage() {
  const { login, session } = useAuth()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) {
    const from = (location.state as { from?: string } | null)?.from ?? '/admin'
    return <Navigate to={from} replace />
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(username, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={onSubmit} className="glass-panel w-full max-w-sm space-y-5 rounded-sm p-8">
        <div className="text-center">
          <SerifHeading className="text-3xl">Memory Shelf</SerifHeading>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-mutedgray">Administration</p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-wide text-mutedgray">Username</label>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoFocus
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 text-warmwhite focus:border-gold focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-wide text-mutedgray">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 text-warmwhite focus:border-gold focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
