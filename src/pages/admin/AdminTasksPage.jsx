import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import TaskFilters from '../../components/tasks/TaskFilters'
import TaskTable from '../../components/tasks/TaskTable'
import Card from '../../components/ui/Card'
import PageState from '../../components/ui/PageState'
import { getProjects } from '../../lib/api/projects'
import { getTasks } from '../../lib/api/tasks'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [taskData, projectData] = await Promise.all([getTasks(filters), getProjects()])
        if (!active) return
        setTasks(taskData)
        setProjects(projectData)
      } catch (requestError) {
        if (!active) return
        setError(requestError?.message || 'Failed to load tasks.')
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
  }, [filters])

  function handleFilterChange(key, value) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <AppShell title="Tasks" navItems={NAV_BY_ROLE[USER_ROLES.ADMIN]}>
      <Card title="Filters">
        <TaskFilters filters={filters} onChange={handleFilterChange} showProject projects={projects} />
      </Card>

      <div className="mt-4">
        <Card title="Task List">
          {loading ? <PageState>Loading tasks...</PageState> : null}
          {!loading && error ? <PageState>{error}</PageState> : null}
          {!loading && !error ? <TaskTable tasks={tasks} detailBasePath="/admin/tasks" /> : null}
        </Card>
      </div>
    </AppShell>
  )
}
