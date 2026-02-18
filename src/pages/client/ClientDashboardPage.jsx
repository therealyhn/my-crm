import { useEffect, useMemo, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import PageState from '../../components/ui/PageState'
import TaskTable from '../../components/tasks/TaskTable'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'
import { getTasks } from '../../lib/api/tasks'

export default function ClientDashboardPage() {
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
        setError(requestError?.message || 'Failed to load dashboard.')
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
    const open = tasks.filter((task) => ['draft', 'open', 'in_progress', 'waiting_client'].includes(task.status)).length
    const done = tasks.filter((task) => task.status === 'done').length
    return { open, done }
  }, [tasks])

  return (
    <AppShell title="Client Dashboard" navItems={NAV_BY_ROLE[USER_ROLES.CLIENT]}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Open Tasks">
          <p className="text-2xl font-semibold text-slate-900">{stats.open}</p>
        </Card>
        <Card title="Completed Tasks">
          <p className="text-2xl font-semibold text-slate-900">{stats.done}</p>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Recent Tasks">
          {loading ? <PageState>Loading tasks...</PageState> : null}
          {!loading && error ? <PageState>{error}</PageState> : null}
          {!loading && !error ? <TaskTable tasks={tasks.slice(0, 10)} detailBasePath="/client/tasks" /> : null}
        </Card>
      </div>
    </AppShell>
  )
}
