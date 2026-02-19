import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import PageState from '../../components/ui/PageState'
import { createProject, getProjectById, getProjects, updateProject } from '../../lib/api/projects'
import { getClients } from '../../lib/api/clients'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'
import { formatDate } from '../../lib/utils/format'

const INITIAL_FORM = {
  client_id: '',
  name: '',
  description: '',
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [overviewTarget, setOverviewTarget] = useState(null)
  const [overviewData, setOverviewData] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [isEditingOverview, setIsEditingOverview] = useState(false)
  const [savingOverview, setSavingOverview] = useState(false)
  const [overviewForm, setOverviewForm] = useState(null)

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [projectsData, clientsData] = await Promise.all([getProjects(), getClients()])
      setProjects(projectsData)
      setClients(clientsData)
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load projects.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleCreate(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createProject({
        client_id: Number(form.client_id),
        name: form.name,
        description: form.description || null,
      })
      setForm(INITIAL_FORM)
      await loadData()
    } catch (requestError) {
      setError(requestError?.message || 'Failed to create project.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOpenOverview(project) {
    setOverviewTarget(project)
    setOverviewLoading(true)
    setOverviewData(null)
    setIsEditingOverview(false)
    setOverviewForm(null)
    try {
      const projectDetails = await getProjectById(project.id)
      setOverviewData(projectDetails)
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load project details.')
    } finally {
      setOverviewLoading(false)
    }
  }

  async function handleSaveOverview() {
    if (!overviewTarget || !overviewForm) return
    setSavingOverview(true)
    try {
      await updateProject(overviewTarget.id, {
        ...overviewForm,
        client_id: Number(overviewForm.client_id),
      })

      await loadData()
      const refreshed = await getProjectById(overviewTarget.id)
      setOverviewData(refreshed)
      setIsEditingOverview(false)
    } catch (requestError) {
      setError(requestError?.message || 'Failed to update project info.')
    } finally {
      setSavingOverview(false)
    }
  }

  return (
    <AppShell title="Projects" navItems={NAV_BY_ROLE[USER_ROLES.ADMIN]}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Create Project">
          <form className="space-y-2" onSubmit={handleCreate}>
            <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={form.client_id} onChange={(event) => setForm((prev) => ({ ...prev, client_id: event.target.value }))} required>
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Project name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
            <textarea className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Description" rows={4} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
            <button className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70" disabled={submitting} type="submit">
              {submitting ? 'Saving...' : 'Create Project'}
            </button>
          </form>
        </Card>

        <Card title="Project List">
          {loading ? <PageState>Loading projects...</PageState> : null}
          {!loading && error ? <PageState>{error}</PageState> : null}
          {!loading && !error && projects.length === 0 ? <PageState>No projects found.</PageState> : null}
          {!loading && !error && projects.length > 0 ? (
            <ul className="space-y-2">
              {projects.map((project) => (
                <li key={project.id} className="flex items-start justify-between gap-3 rounded border border-slate-200 p-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{project.name}</p>
                    <p className="text-slate-600">Client: {project.client_name || '-'}</p>
                    <p className="text-slate-500">Status: {project.status}</p>
                  </div>
                  <Button type="button" variant="ghost" className="px-2 py-1 text-xs" onClick={() => handleOpenOverview(project)}>
                    View
                  </Button>
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
                <p className="text-sm text-slate-500">Project overview</p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditingOverview ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const p = overviewData
                      if (!p) return
                      setOverviewForm({
                        client_id: String(p.client_id || ''),
                        name: p.name || '',
                        description: p.description || '',
                        domain_main: p.domain_main || '',
                        github_url: p.github_url || '',
                        cms_org_name: p.cms_org_name || '',
                        cms_org_id: p.cms_org_id || '',
                        cms_project_name: p.cms_project_name || '',
                        cms_url: p.cms_url || '',
                        cms_app_id: p.cms_app_id || '',
                        notes: p.notes || '',
                        status: p.status || 'active',
                        start_date: p.start_date || '',
                        due_date: p.due_date || '',
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

            {overviewLoading ? <PageState>Loading project details...</PageState> : null}
            {!overviewLoading && !overviewData ? <PageState>No data found.</PageState> : null}
            {!overviewLoading && overviewData ? (
              <div className="mt-3 rounded-sm border border-border bg-background p-3">
                {!isEditingOverview ? (
                  <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <p><span className="font-medium text-slate-900">Client:</span> {overviewData.client_name || '-'}</p>
                    <p><span className="font-medium text-slate-900">Status:</span> {overviewData.status || '-'}</p>
                    <p><span className="font-medium text-slate-900">Domain:</span> {overviewData.domain_main || '-'}</p>
                    <p><span className="font-medium text-slate-900">GitHub:</span> {overviewData.github_url || '-'}</p>
                    <p><span className="font-medium text-slate-900">CMS Org:</span> {overviewData.cms_org_name || '-'}</p>
                    <p><span className="font-medium text-slate-900">CMS Org ID:</span> {overviewData.cms_org_id || '-'}</p>
                    <p><span className="font-medium text-slate-900">CMS Project:</span> {overviewData.cms_project_name || '-'}</p>
                    <p><span className="font-medium text-slate-900">CMS URL:</span> {overviewData.cms_url || '-'}</p>
                    <p><span className="font-medium text-slate-900">CMS App ID:</span> {overviewData.cms_app_id || '-'}</p>
                    <p><span className="font-medium text-slate-900">Start date:</span> {overviewData.start_date || '-'}</p>
                    <p><span className="font-medium text-slate-900">Due date:</span> {overviewData.due_date || '-'}</p>
                    <p><span className="font-medium text-slate-900">Created:</span> {formatDate(overviewData.created_at)}</p>
                    <p className="sm:col-span-2"><span className="font-medium text-slate-900">Description:</span> {overviewData.description || '-'}</p>
                    <p className="sm:col-span-2"><span className="font-medium text-slate-900">Notes:</span> {overviewData.notes || '-'}</p>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={overviewForm?.client_id || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, client_id: event.target.value }))}>
                      <option value="">Select client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                    <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm" value={overviewForm?.status || 'active'} onChange={(event) => setOverviewForm((prev) => ({ ...prev, status: event.target.value }))}>
                      <option value="active">active</option>
                      <option value="on_hold">on_hold</option>
                      <option value="archived">archived</option>
                    </select>
                    <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Project name" value={overviewForm?.name || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, name: event.target.value }))} />
                    <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Domain" value={overviewForm?.domain_main || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, domain_main: event.target.value }))} />
                    <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" placeholder="GitHub URL" value={overviewForm?.github_url || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, github_url: event.target.value }))} />
                    <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="CMS org" value={overviewForm?.cms_org_name || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, cms_org_name: event.target.value }))} />
                    <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="CMS org ID" value={overviewForm?.cms_org_id || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, cms_org_id: event.target.value }))} />
                    <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="CMS project" value={overviewForm?.cms_project_name || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, cms_project_name: event.target.value }))} />
                    <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" placeholder="CMS app ID" value={overviewForm?.cms_app_id || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, cms_app_id: event.target.value }))} />
                    <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" placeholder="CMS URL" value={overviewForm?.cms_url || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, cms_url: event.target.value }))} />
                    <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" type="date" value={overviewForm?.start_date || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, start_date: event.target.value }))} />
                    <input className="w-full rounded border border-slate-300 px-3 py-2 text-sm" type="date" value={overviewForm?.due_date || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, due_date: event.target.value }))} />
                    <textarea className="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" rows={3} placeholder="Description" value={overviewForm?.description || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, description: event.target.value }))} />
                    <textarea className="w-full rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" rows={3} placeholder="Notes" value={overviewForm?.notes || ''} onChange={(event) => setOverviewForm((prev) => ({ ...prev, notes: event.target.value }))} />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
