import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/memories', label: 'Memories' },
  { to: '/admin/qr-codes', label: 'QR Codes' },
  { to: '/admin/import-export', label: 'Import / Export' },
  { to: '/admin/settings', label: 'Settings' },
]

export function AdminLayout() {
  const { session, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-void-deep">
      <aside className="hidden w-60 shrink-0 border-r border-line/60 p-6 md:block">
        <p className="font-display text-2xl text-warmwhite">Memory Shelf</p>
        <p className="mb-8 text-xs uppercase tracking-[0.2em] text-mutedgray">Administration</p>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-sm px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-violet/40 text-gold-soft' : 'text-mutedgray hover:text-warmwhite'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-10 border-t border-line/60 pt-4 text-xs text-mutedgray">
          <p className="mb-2">Signed in as {session?.displayName}</p>
          <button onClick={logout} className="text-mutedgray transition-colors hover:text-gold-soft">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  )
}
