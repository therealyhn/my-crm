import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import PageState from '../../components/ui/PageState'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'
import { createClient, deleteClient, getClients } from '../../lib/api/clients'

const INITIAL_FORM = {
  name: '',
  company_name: '',
  email: '',
  phone: '',
  default_hourly_rate: '',
  login_email: '',
  login_password: '',
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [error, setError] = useState('')

  async function loadClients() {
    setLoading(true)
    setError('')
    try {
      const data = await getClients()
      setClients(data)
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load clients.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  async function handleCreate(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createClient({
        ...form,
        default_hourly_rate: form.default_hourly_rate === '' ? null : Number(form.default_hourly_rate),
      })
      setForm(INITIAL_FORM)
      await loadClients()
    } catch (requestError) {
      setError(requestError?.message || 'Failed to create client.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(clientId) {
    setDeleting(true)
    setError('')
    try {
      await deleteClient(clientId)
      setDeleteTarget(null)
      await loadClients()
    } catch (requestError) {
      setError(requestError?.message || 'Failed to delete client.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell title="Clients" navItems={NAV_BY_ROLE[USER_ROLES.ADMIN]}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Create Client">
          <form className="space-y-2" onSubmit={handleCreate}>
            <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
            <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Company" value={form.company_name} onChange={(event) => setForm((prev) => ({ ...prev, company_name: event.target.value }))} />
            <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
            <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
            <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Default hourly rate" type="number" min="0" step="0.01" value={form.default_hourly_rate} onChange={(event) => setForm((prev) => ({ ...prev, default_hourly_rate: event.target.value }))} />
            <div className="rounded border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Client Login Credentials</p>
              <div className="space-y-2">
                <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Login email" type="email" value={form.login_email} onChange={(event) => setForm((prev) => ({ ...prev, login_email: event.target.value }))} required />
                <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Login password (min 6)" type="password" value={form.login_password} onChange={(event) => setForm((prev) => ({ ...prev, login_password: event.target.value }))} minLength={6} required />
              </div>
            </div>
            <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70" disabled={submitting} type="submit">
              {submitting ? 'Saving...' : 'Create Client'}
            </button>
          </form>
        </Card>

        <Card title="Client List">
          {loading ? <PageState>Loading clients...</PageState> : null}
          {!loading && error ? <PageState>{error}</PageState> : null}
          {!loading && !error && clients.length === 0 ? <PageState>No clients found.</PageState> : null}
          {!loading && !error && clients.length > 0 ? (
            <ul className="space-y-2">
              {clients.map((client) => (
                <li key={client.id} className="flex items-start justify-between gap-3 rounded border border-slate-200 p-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{client.name}</p>
                    <p className="text-slate-600">{client.company_name || '-'}</p>
                    <p className="text-slate-500">{client.email || '-'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(client)}
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg">
            <h3 className="text-base font-semibold text-slate-900">Are you sure?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Delete client <span className="font-medium text-slate-900">{deleteTarget.name}</span>? This will also delete related projects, tasks, comments, attachments and client users.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTarget.id)}
                className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500 disabled:opacity-70"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
