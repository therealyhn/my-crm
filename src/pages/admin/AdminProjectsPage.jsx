import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import PageState from '../../components/ui/PageState'
import { createProject, getProjects } from '../../lib/api/projects'
import { getClients } from '../../lib/api/clients'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'

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
                <li key={project.id} className="rounded border border-slate-200 p-3 text-sm">
                  <p className="font-medium text-slate-900">{project.name}</p>
                  <p className="text-slate-600">Client: {project.client_name || '-'}</p>
                  <p className="text-slate-500">Status: {project.status}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      </div>
    </AppShell>
  )
}
