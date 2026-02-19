import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'
import { changePassword } from '../../lib/api/auth'

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
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  async function handleChangePassword(event) {
    event.preventDefault()
    if (passwordSubmitting) return

    setPasswordError('')
    setPasswordSuccess('')
    setPasswordSubmitting(true)

    try {
      await changePassword(passwordForm)
      setPasswordSuccess('Password updated successfully.')
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (requestError) {
      setPasswordError(requestError?.message || 'Failed to change password.')
    } finally {
      setPasswordSubmitting(false)
    }
  }

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
              <Button type="button" onClick={() => setShowPasswordModal(true)} variant="ghost">
                Change Password
              </Button>
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

      {showPasswordModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-sm border border-border bg-surface p-4 shadow-frame">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-h3 text-text">Change Password</h3>
              <Button type="button" variant="ghost" onClick={() => setShowPasswordModal(false)}>
                Close
              </Button>
            </div>
            <form className="space-y-2" onSubmit={handleChangePassword}>
              <input
                type="password"
                className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-text"
                placeholder="Current password"
                value={passwordForm.current_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))}
                required
              />
              <input
                type="password"
                className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-text"
                placeholder="New password"
                value={passwordForm.new_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))}
                minLength={8}
                required
              />
              <input
                type="password"
                className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-text"
                placeholder="Confirm new password"
                value={passwordForm.confirm_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm_password: event.target.value }))}
                minLength={8}
                required
              />
              {passwordError ? <p className="text-sm text-red-600">{passwordError}</p> : null}
              {passwordSuccess ? <p className="text-sm text-emerald-600">{passwordSuccess}</p> : null}
              <Button type="submit" disabled={passwordSubmitting}>
                {passwordSubmitting ? 'Saving...' : 'Save Password'}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
