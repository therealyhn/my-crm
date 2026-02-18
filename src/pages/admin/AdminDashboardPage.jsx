import { useEffect, useMemo, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import PageState from '../../components/ui/PageState'
import TaskTable from '../../components/tasks/TaskTable'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'
import { getTasks } from '../../lib/api/tasks'
import { useAuth } from '../../hooks/useAuth'

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getTasks()
        if (!active) return
        setTasks(data)
      } catch (requestError) {
        if (!active) return
        setError(requestError?.message || 'Failed to load dashboard data.')
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

  const stats = useMemo(() => {
    const total = tasks.filter((task) => ['draft', 'open'].includes(task.status)).length
    const waitingClient = tasks.filter((task) => task.status === 'waiting_client').length
    const inProgress = tasks.filter((task) => task.status === 'in_progress').length
    return { total, waitingClient, inProgress }
  }, [tasks])

  const openAndDraftTasks = useMemo(
    () => tasks.filter((task) => ['draft', 'open'].includes(task.status)),
    [tasks],
  )

  return (
    <AppShell title="Admin Dashboard" navItems={NAV_BY_ROLE[USER_ROLES.ADMIN]}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Open + Draft">
          <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
        </Card>
        <Card title="In Progress">
          <p className="text-2xl font-semibold text-slate-900">{stats.inProgress}</p>
        </Card>
        <Card title="Waiting Client">
          <p className="text-2xl font-semibold text-slate-900">{stats.waitingClient}</p>
        </Card>
      </div>

      <div className="mt-4">
        <Card title={`Welcome, ${user?.name || 'Admin'}`}>
          {loading ? <PageState>Loading tasks...</PageState> : null}
          {!loading && error ? <PageState>{error}</PageState> : null}
          {!loading && !error ? <TaskTable tasks={openAndDraftTasks.slice(0, 10)} detailBasePath="/admin/tasks" /> : null}
        </Card>
      </div>
    </AppShell>
  )
}
