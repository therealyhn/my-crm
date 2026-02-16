import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function AppShell({ title, children }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Client CRM Portal</p>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded bg-slate-100 px-3 py-1 text-slate-700">
              {user?.name} ({user?.role})
            </span>
            <Link className="text-slate-600 hover:text-slate-900" to={user?.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'}>
              Dashboard
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
