import { useEffect, useState } from 'react'
import type { PublicUser, Role } from '../../domain/models'
import { useServices } from '../../context/ServiceContext'
import { useAuth } from '../../context/AuthContext'
import { SerifHeading } from '../../components/common/SerifHeading'
import { Button } from '../../components/common/Button'

export function UsersPage() {
  const { users } = useServices()
  const { session } = useAuth()
  const [list, setList] = useState<PublicUser[]>([])
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('admin')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function refresh() {
    users.list().then(setList)
  }

  useEffect(refresh, [users])

  async function onCreate(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await users.create(username, displayName, password, role)
      setUsername('')
      setDisplayName('')
      setPassword('')
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create user')
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: string) {
    if (id === session?.userId) return
    if (!confirm('Remove this user?')) return
    await users.delete(id)
    refresh()
  }

  return (
    <div className="space-y-8">
      <SerifHeading className="text-3xl">Users</SerifHeading>

      <form onSubmit={onCreate} className="glass-panel grid gap-4 rounded-sm p-6 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Username</label>
          <input
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Display name</label>
          <input
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-mutedgray">Role</label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
            className="w-full rounded-sm border border-line bg-transparent px-3 py-2 focus:border-gold focus:outline-none"
          >
            <option value="admin">Administrator</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-300 md:col-span-2">{error}</p>}
        <div className="md:col-span-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Add User'}
          </Button>
        </div>
      </form>

      <div className="glass-panel divide-y divide-line/40 rounded-sm">
        {list.map((user) => (
          <div key={user.id} className="flex items-center justify-between px-5 py-3 text-sm">
            <div>
              <p className="text-warmwhite">{user.displayName}</p>
              <p className="text-xs text-mutedgray">
                @{user.username} · {user.role}
              </p>
            </div>
            {user.id !== session?.userId && (
              <button onClick={() => onDelete(user.id)} className="text-xs text-mutedgray hover:text-red-300">
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
