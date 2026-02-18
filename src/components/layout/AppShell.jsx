import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative rounded px-2 py-1.5 text-sm font-medium transition ${isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'}`
      }
    >
      {({ isActive }) => (
        <>
          <span>{label}</span>
          <span
            className={`absolute bottom-0 left-0 h-0.5 w-full bg-accent transition-transform duration-200 ${isActive ? 'scale-x-100 animate-sweep' : 'scale-x-0'
              }`}
          />
        </>
      )}
    </NavLink>
  )
}

export default function AppShell({ title, navItems = [], children }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-label font-semibold uppercase text-muted">Jovan Ljušić CRM Portal</p>
              <h1 className="font-display text-h3 text-text">{title}</h1>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center rounded-sm border border-slate-300 px-3 py-2 text-label font-semibold uppercase text-slate-600">
                {user?.name} ({user?.role})
              </span>
              <Button type="button" onClick={logout} variant="ghost">
                Logout
              </Button>
            </div>
          </div>

          <div className="h-px w-full bg-slate-300/80" />

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
