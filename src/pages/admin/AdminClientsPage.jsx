import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import PageState from '../../components/ui/PageState'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'
import { createClient, deleteClient, getClientOverview, getClients, updateClient, updateClientCredentials } from '../../lib/api/clients'
import { formatDate } from '../../lib/utils/format'

const INITIAL_FORM = {
  name: '',
  company_name: '',
  email: '',
  phone: '',
  instagram: '',
  domain_main: '',
  hosting_provider: '',
  hosting_panel_url: '',
  hosting_login: '',
  hosting_password: '',
  github_url: '',
  cms_org_name: '',
  cms_org_id: '',
  cms_project_name: '',
  cms_url: '',
  cms_app_id: '',
  notes: '',
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
  const [showHosting, setShowHosting] = useState(false)
  const [showCms, setShowCms] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [overviewTarget, setOverviewTarget] = useState(null)
  const [overviewData, setOverviewData] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [isEditingOverview, setIsEditingOverview] = useState(false)
  const [savingOverview, setSavingOverview] = useState(false)
  const [overviewForm, setOverviewForm] = useState(null)

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

  async function handleOpenOverview(client) {
    setOverviewTarget(client)
    setOverviewLoading(true)
    setOverviewData(null)
    setIsEditingOverview(false)
    setOverviewForm(null)
    try {
      const data = await getClientOverview(client.id)
      setOverviewData(data)
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load client details.')
    } finally {
      setOverviewLoading(false)
    }
  }

  async function handleSaveOverview() {
    if (!overviewTarget || !overviewForm) return
    setSavingOverview(true)
    try {
      await updateClient(overviewTarget.id, {
        ...overviewForm,
        default_hourly_rate: overviewForm.default_hourly_rate === '' ? null : Number(overviewForm.default_hourly_rate),
      })

      await updateClientCredentials(overviewTarget.id, {
        login_email: overviewForm.login_email,
        new_password: overviewForm.new_password || null,
        is_active: overviewForm.login_is_active,
      })

      await loadClients()
      const refreshed = await getClientOverview(overviewTarget.id)
      setOverviewData(refreshed)
      setIsEditingOverview(false)
    } catch (requestError) {
      setError(requestError?.message || 'Failed to update client info.')
    } finally {
      setSavingOverview(false)
    }
  }

  return (
    <AppShell title="Clients" navItems={NAV_BY_ROLE[USER_ROLES.ADMIN]}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Create Client">
          <form className="space-y-2" onSubmit={handleCreate}>
            <div className="rounded-sm border border-border bg-background p-3">
              <p className="mb-2 text-label font-semibold uppercase text-muted">Basic Info</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input placeholder="Name *" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
                <Input placeholder="Company" value={form.company_name} onChange={(event) => setForm((prev) => ({ ...prev, company_name: event.target.value }))} />
                <Input placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
                <Input placeholder="Phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
                <Input placeholder="Instagram" value={form.instagram} onChange={(event) => setForm((prev) => ({ ...prev, instagram: event.target.value }))} />
                <Input placeholder="Default hourly rate (EUR)" type="number" min="0" step="0.01" value={form.default_hourly_rate} onChange={(event) => setForm((prev) => ({ ...prev, default_hourly_rate: event.target.value }))} />
              </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-3">
              <p className="mb-2 text-label font-semibold uppercase text-muted">Client CRM Login</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input placeholder="Login email *" type="email" value={form.login_email} onChange={(event) => setForm((prev) => ({ ...prev, login_email: event.target.value }))} required />
                <Input placeholder="Login password (min 6) *" type="password" value={form.login_password} onChange={(event) => setForm((prev) => ({ ...prev, login_password: event.target.value }))} minLength={6} required />
              </div>
            </div>

            <div className="rounded-sm border border-border bg-background p-3">
              <button type="button" onClick={() => setShowHosting((prev) => !prev)} className="flex w-full items-center justify-between text-left">
                <p className="text-label font-semibold uppercase text-muted">Domain & Hosting</p>
                <span className="text-xs text-slate-500">{showHosting ? 'Hide' : 'Show'}</span>
              </button>
              {showHosting ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Input placeholder="Main domain" value={form.domain_main} onChange={(event) => setForm((prev) => ({ ...prev, domain_main: event.target.value }))} />
                  <Input placeholder="Hosting provider" value={form.hosting_provider} onChange={(event) => setForm((prev) => ({ ...prev, hosting_provider: event.target.value }))} />
                  <Input placeholder="Hosting panel URL" value={form.hosting_panel_url} onChange={(event) => setForm((prev) => ({ ...prev, hosting_panel_url: event.target.value }))} />
                  <Input placeholder="Hosting login" value={form.hosting_login} onChange={(event) => setForm((prev) => ({ ...prev, hosting_login: event.target.value }))} />
                  <Input className="sm:col-span-2" placeholder="Hosting password" type="text" value={form.hosting_password} onChange={(event) => setForm((prev) => ({ ...prev, hosting_password: event.target.value }))} />
                </div>
              ) : null}
            </div>

            <div className="rounded-sm border border-border bg-background p-3">
              <button type="button" onClick={() => setShowCms((prev) => !prev)} className="flex w-full items-center justify-between text-left">
                <p className="text-label font-semibold uppercase text-muted">GitHub & Sanity</p>
                <span className="text-xs text-slate-500">{showCms ? 'Hide' : 'Show'}</span>
              </button>
              {showCms ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Input className="sm:col-span-2" placeholder="GitHub URL" value={form.github_url} onChange={(event) => setForm((prev) => ({ ...prev, github_url: event.target.value }))} />
                  <Input placeholder="Sanity organization" value={form.cms_org_name} onChange={(event) => setForm((prev) => ({ ...prev, cms_org_name: event.target.value }))} />
                  <Input placeholder="Sanity organization ID" value={form.cms_org_id} onChange={(event) => setForm((prev) => ({ ...prev, cms_org_id: event.target.value }))} />
                  <Input placeholder="Sanity project name" value={form.cms_project_name} onChange={(event) => setForm((prev) => ({ ...prev, cms_project_name: event.target.value }))} />
                  <Input placeholder="Sanity app ID" value={form.cms_app_id} onChange={(event) => setForm((prev) => ({ ...prev, cms_app_id: event.target.value }))} />
                  <Input className="sm:col-span-2" placeholder="Sanity URL" value={form.cms_url} onChange={(event) => setForm((prev) => ({ ...prev, cms_url: event.target.value }))} />
                </div>
              ) : null}
            </div>

            <div className="rounded-sm border border-border bg-background p-3">
              <button type="button" onClick={() => setShowNotes((prev) => !prev)} className="flex w-full items-center justify-between text-left">
                <p className="text-label font-semibold uppercase text-muted">Notes</p>
                <span className="text-xs text-slate-500">{showNotes ? 'Hide' : 'Show'}</span>
              </button>
              {showNotes ? (
                <textarea className="mt-2 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-text transition-colors focus:border-accentSoft focus:outline-none focus:ring-2 focus:ring-slate-300" rows={4} placeholder="Internal notes..." value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
              ) : null}
            </div>

            <Button disabled={submitting} type="submit">
              {submitting ? 'Saving...' : 'Create Client'}
            </Button>
          </form>
        </Card>

        <Card title="Client List">
          {loading ? <PageState>Loading clients...</PageState> : null}
          {!loading && error ? <PageState>{error}</PageState> : null}
          {!loading && !error && clients.length === 0 ? <PageState>No clients found.</PageState> : null}
          {!loading && !error && clients.length > 0 ? (
            <ul className="space-y-2">
              {clients.map((client) => (
                <li key={client.id} className="flex items-start justify-between gap-3 rounded-surface border border-border p-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{client.name}</p>
                    <p className="text-slate-600">{client.company_name || '-'}</p>
                    <p className="text-slate-500">{client.email || '-'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => handleOpenOverview(client)}
                      className="px-2 py-1 text-xs"
                      variant="ghost"
                    >
                      View
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setDeleteTarget(client)}
                      className="px-2 py-1 text-xs"
                      variant="danger"
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      </div>

      {overviewTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-sm border border-border bg-surface p-4 shadow-frame">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-h3 text-text">{overviewTarget.name}</h3>
                <p className="text-sm text-slate-500">Client overview</p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditingOverview ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const client = overviewData?.client
                      if (!client) return
                      setOverviewForm({
                        name: client.name || '',
                        company_name: client.company_name || '',
                        email: client.email || '',
                        phone: client.phone || '',
                        instagram: client.instagram || '',
                        domain_main: client.domain_main || '',
                        hosting_provider: client.hosting_provider || '',
                        hosting_panel_url: client.hosting_panel_url || '',
                        hosting_login: client.hosting_login || '',
                        hosting_password: client.hosting_password || '',
                        github_url: client.github_url || '',
                        cms_org_name: client.cms_org_name || '',
                        cms_org_id: client.cms_org_id || '',
                        cms_project_name: client.cms_project_name || '',
                        cms_url: client.cms_url || '',
                        cms_app_id: client.cms_app_id || '',
                        notes: client.notes || '',
                        default_hourly_rate: client.default_hourly_rate || '',
                        is_active: Number(client.is_active || 1) === 1,
                        login_email: overviewData?.credentials?.email || '',
                        new_password: '',
                        login_is_active: Number(overviewData?.credentials?.is_active || 1) === 1,
                      })
                      setIsEditingOverview(true)
                    }}
                  >
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="ghost" disabled={savingOverview} onClick={() => setIsEditingOverview(false)}>
                      Cancel
                    </Button>
                    <Button type="button" disabled={savingOverview} onClick={handleSaveOverview}>
                      {savingOverview ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                )}
                <Button type="button" variant="ghost" onClick={() => setOverviewTarget(null)}>
                  Close
                </Button>
              </div>
            </div>

            {overviewLoading ? <PageState>Loading client details...</PageState> : null}
            {!overviewLoading && !overviewData ? <PageState>No data found.</PageState> : null}
            {!overviewLoading && overviewData ? (
              <div className="mt-3 space-y-4">
                <section className="rounded-sm border border-border bg-background p-3">
                  <p className="mb-2 text-label font-semibold uppercase text-muted">Client Data</p>
                  {!isEditingOverview ? (
                    <>
                      <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                        <p><span className="font-medium text-slate-900">Company:</span> {overviewData.client?.company_name || '-'}</p>
                        <p><span className="font-medium text-slate-900">Email:</span> {overviewData.client?.email || '-'}</p>
                        <p><span className="font-medium text-slate-900">Phone:</span> {overviewData.client?.phone || '-'}</p>
                        <p><span className="font-medium text-slate-900">Instagram:</span> {overviewData.client?.instagram || '-'}</p>
                        <p><span className="font-medium text-slate-900">Domain:</span> {overviewData.client?.domain_main || '-'}</p>
                        <p><span className="font-medium text-slate-900">Hosting:</span> {overviewData.client?.hosting_provider || '-'}</p>
                        <p><span className="font-medium text-slate-900">Panel URL:</span> {overviewData.client?.hosting_panel_url || '-'}</p>
                        <p><span className="font-medium text-slate-900">Hosting Login:</span> {overviewData.client?.hosting_login || '-'}</p>
                        <p><span className="font-medium text-slate-900">Hosting Password:</span> {overviewData.client?.hosting_password || '-'}</p>
                        <p><span className="font-medium text-slate-900">GitHub:</span> {overviewData.client?.github_url || '-'}</p>
                        <p><span className="font-medium text-slate-900">CMS Org:</span> {overviewData.client?.cms_org_name || '-'}</p>
                        <p><span className="font-medium text-slate-900">CMS Org ID:</span> {overviewData.client?.cms_org_id || '-'}</p>
                        <p><span className="font-medium text-slate-900">CMS Project:</span> {overviewData.client?.cms_project_name || '-'}</p>
                        <p><span className="font-medium text-slate-900">CMS URL:</span> {overviewData.client?.cms_url || '-'}</p>
                        <p><span className="font-medium text-slate-900">CMS App ID:</span> {overviewData.client?.cms_app_id || '-'}</p>
                        <p><span className="font-medium text-slate-900">Created:</span> {formatDate(overviewData.client?.created_at)}</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-700"><span className="font-medium text-slate-900">Notes:</span> {overviewData.client?.notes || '-'}</p>
                      <div className="mt-3 rounded-sm border border-slate-200 bg-white p-2 text-sm text-slate-700">
                        <p><span className="font-medium text-slate-900">Login email:</span> {overviewData.credentials?.email || '-'}</p>
                        <p className="mt-1"><span className="font-medium text-slate-900">Password:</span> hidden (security)</p>
                        <p className="mt-1"><span className="font-medium text-slate-900">Last login:</span> {formatDate(overviewData.credentials?.last_login_at)}</p>
                      </div>
                    </>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input placeholder="Name" value={overviewForm?.name || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, name: event.target.value }))} />
                      <Input placeholder="Company" value={overviewForm?.company_name || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, company_name: event.target.value }))} />
                      <Input placeholder="Email" value={overviewForm?.email || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, email: event.target.value }))} />
                      <Input placeholder="Phone" value={overviewForm?.phone || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, phone: event.target.value }))} />
                      <Input placeholder="Instagram" value={overviewForm?.instagram || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, instagram: event.target.value }))} />
                      <Input placeholder="Domain" value={overviewForm?.domain_main || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, domain_main: event.target.value }))} />
                      <Input placeholder="Hosting provider" value={overviewForm?.hosting_provider || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, hosting_provider: event.target.value }))} />
                      <Input placeholder="Hosting panel URL" value={overviewForm?.hosting_panel_url || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, hosting_panel_url: event.target.value }))} />
                      <Input placeholder="Hosting login" value={overviewForm?.hosting_login || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, hosting_login: event.target.value }))} />
                      <Input placeholder="Hosting password" value={overviewForm?.hosting_password || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, hosting_password: event.target.value }))} />
                      <Input placeholder="GitHub URL" value={overviewForm?.github_url || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, github_url: event.target.value }))} />
                      <Input placeholder="CMS org" value={overviewForm?.cms_org_name || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, cms_org_name: event.target.value }))} />
                      <Input placeholder="CMS org ID" value={overviewForm?.cms_org_id || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, cms_org_id: event.target.value }))} />
                      <Input placeholder="CMS project" value={overviewForm?.cms_project_name || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, cms_project_name: event.target.value }))} />
                      <Input placeholder="CMS URL" value={overviewForm?.cms_url || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, cms_url: event.target.value }))} />
                      <Input placeholder="CMS app ID" value={overviewForm?.cms_app_id || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, cms_app_id: event.target.value }))} />
                      <Input placeholder="Hourly rate" type="number" min="0" step="0.01" value={overviewForm?.default_hourly_rate || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, default_hourly_rate: event.target.value }))} />
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={!!overviewForm?.is_active} onChange={(event) => setOverviewForm((prev) => ({ ...prev, is_active: event.target.checked }))} />
                        Active client
                      </label>
                      <Input placeholder="Login email" type="email" value={overviewForm?.login_email || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, login_email: event.target.value }))} />
                      <Input placeholder="Set new password (optional)" type="password" minLength={8} value={overviewForm?.new_password || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, new_password: event.target.value }))} />
                      <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                        <input type="checkbox" checked={!!overviewForm?.login_is_active} onChange={(event) => setOverviewForm((prev) => ({ ...prev, login_is_active: event.target.checked }))} />
                        Login account active
                      </label>
                      <textarea className="sm:col-span-2 w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-text transition-colors focus:border-accentSoft focus:outline-none focus:ring-2 focus:ring-slate-300" rows={3} placeholder="Notes" value={overviewForm?.notes || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, notes: event.target.value }))} />
                    </div>
                  )}
                </section>

                <section className="rounded-sm border border-border bg-background p-3">
                  <p className="mb-2 text-label font-semibold uppercase text-muted">Projects ({overviewData.projects?.length || 0})</p>
                  {!overviewData.projects || overviewData.projects.length === 0 ? <p className="text-sm text-slate-500">No projects.</p> : (
                    <ul className="space-y-2">
                      {overviewData.projects.map((project) => (
                        <li key={project.id} className="rounded-sm border border-slate-200 p-2 text-sm">
                          <Link className="font-medium text-slate-900 hover:underline" to={`/admin/tasks?project_id=${project.id}`}>
                            {project.name}
                          </Link>
                          <p className="text-slate-600">Status: {project.status}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="rounded-sm border border-border bg-background p-3">
                  <p className="mb-2 text-label font-semibold uppercase text-muted">Tasks ({overviewData.tasks?.length || 0})</p>
                  {!overviewData.tasks || overviewData.tasks.length === 0 ? <p className="text-sm text-slate-500">No tasks.</p> : (
                    <ul className="space-y-2">
                      {overviewData.tasks.map((task) => (
                        <li key={task.id} className="rounded-sm border border-slate-200 p-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <Link className="font-medium text-slate-900 hover:underline" to={`/admin/tasks/${task.id}`}>
                              {task.title}
                            </Link>
                            <p className="text-xs text-slate-500">{task.status}</p>
                          </div>
                          <p className="text-slate-600">Project: {task.project_name || '-'}</p>
                          <p className="text-slate-500">Type: {task.task_type} | Priority: {task.priority}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-sm rounded-sm border border-border bg-surface p-4 shadow-frame">
            <h3 className="font-display text-h3 text-text">Are you sure?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Delete client <span className="font-medium text-slate-900">{deleteTarget.name}</span>? This will also delete related projects, tasks, comments, attachments and client users.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setDeleteTarget(null)}
                variant="ghost"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleDelete(deleteTarget.id)}
                variant="danger"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
