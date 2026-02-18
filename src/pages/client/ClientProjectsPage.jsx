import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import PageState from '../../components/ui/PageState'
import ClientTaskCreateCard from '../../components/tasks/ClientTaskCreateCard'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'
import { getProjects } from '../../lib/api/projects'

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getProjects()
        if (!active) return
        setProjects(data)
      } catch (requestError) {
        if (!active) return
        setError(requestError?.message || 'Failed to load projects.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <AppShell title="Projects" navItems={NAV_BY_ROLE[USER_ROLES.CLIENT]}>
      <ClientTaskCreateCard projects={projects} />

      <div className="mt-4">
      <Card title="My Projects">
        {loading ? <PageState>Loading projects...</PageState> : null}
        {!loading && error ? <PageState>{error}</PageState> : null}
        {!loading && !error && projects.length === 0 ? <PageState>No projects found.</PageState> : null}
        {!loading && !error && projects.length > 0 ? (
          <ul className="space-y-2">
            {projects.map((project) => (
              <li key={project.id} className="rounded border border-slate-200 p-3 text-sm">
                <Link className="font-medium text-slate-900 hover:underline" to={`/client/projects/${project.id}`}>
                  {project.name}
                </Link>
                <p className="text-slate-600">Status: {project.status}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
      </div>
    </AppShell>
  )
}
