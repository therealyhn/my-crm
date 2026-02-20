import { useEffect, useMemo, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import TaskFilters from '../../components/tasks/TaskFilters'
import TaskTable from '../../components/tasks/TaskTable'
import Card from '../../components/ui/Card'
import PageState from '../../components/ui/PageState'
import { getProjects } from '../../lib/api/projects'
import { deleteTask, getTasks } from '../../lib/api/tasks'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingTaskId, setDeletingTaskId] = useState(null)

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

  async function handleDeleteTask(task) {
    const ok = window.confirm(`Delete task "${task?.title || 'this task'}"?`)
    if (!ok || !task?.id) return

    setDeletingTaskId(task.id)
    setError('')
    try {
      await deleteTask(task.id)
      setTasks((prev) => prev.filter((item) => item.id !== task.id))
    } catch (requestError) {
      setError(requestError?.message || 'Failed to delete task.')
    } finally {
      setDeletingTaskId(null)
    }
  }

  const stats = useMemo(() => {
    const total = tasks.length
    const active = tasks.filter((task) => ['draft', 'open', 'in_progress', 'waiting_client'].includes(task.status)).length
    const completed = tasks.filter((task) => ['done', 'cancelled'].includes(task.status) && task.invoice_status === 'paid').length
    return { total, active, completed }
  }, [tasks])

  return (
    <AppShell title="Tasks" navItems={NAV_BY_ROLE[USER_ROLES.ADMIN]}>
      <Card title="Filters">
        <TaskFilters filters={filters} onChange={handleFilterChange} showProject projects={projects} />
      </Card>

      <div className="mt-4">
        <Card title="Task List">
          {!loading && !error ? (
            <div className="mb-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Filtered Tasks</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{stats.total}</p>
              </div>
              <div className="rounded-sm border border-blue-200 bg-blue-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Active</p>
                <p className="mt-1 text-lg font-semibold text-blue-900">{stats.active}</p>
              </div>
              <div className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Fully Completed</p>
                <p className="mt-1 text-lg font-semibold text-emerald-900">{stats.completed}</p>
              </div>
            </div>
          ) : null}
          {loading ? <PageState>Loading tasks...</PageState> : null}
          {!loading && error ? <PageState>{error}</PageState> : null}
          {!loading && !error ? (
            <TaskTable
              tasks={tasks}
              detailBasePath="/admin/tasks"
              showClient
              showDelete
              deletingTaskId={deletingTaskId}
              onDelete={handleDeleteTask}
            />
          ) : null}
        </Card>
      </div>
    </AppShell>
  )
}
