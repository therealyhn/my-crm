import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded px-2 py-1 text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
      }
    >
      {label}
    </NavLink>
  )
}

export default function AppShell({ title, navItems = [], children }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Client CRM Portal</p>
              <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded bg-slate-100 px-3 py-1 text-slate-700">
                {user?.name} ({user?.role})
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </div>

          {navItems.length > 0 ? (
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <NavItem key={item.to} to={item.to} label={item.label} />
              ))}
            </nav>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
