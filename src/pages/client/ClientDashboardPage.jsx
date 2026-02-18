import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import PageState from '../../components/ui/PageState'
import TaskTable from '../../components/tasks/TaskTable'
import ClientTaskCreateCard from '../../components/tasks/ClientTaskCreateCard'
import Button from '../../components/ui/Button'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'
import { getTasks } from '../../lib/api/tasks'
import { getProjects } from '../../lib/api/projects'
import { getNotifications, markAllNotificationsRead } from '../../lib/api/notifications'
import { formatDate } from '../../lib/utils/format'

export default function ClientDashboardPage() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationsError, setNotificationsError] = useState('')
  const [markingRead, setMarkingRead] = useState(false)

  async function loadTasksAndProjects() {
    setLoading(true)
    setError('')
    try {
      const [taskData, projectData] = await Promise.all([getTasks(), getProjects()])
      setTasks(taskData)
      setProjects(projectData)
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  async function loadNotifications() {
    setNotificationsLoading(true)
    setNotificationsError('')
    try {
      const payload = await getNotifications({ limit: 8, unread_only: true })
      setNotifications(payload.data)
      setUnreadCount(payload.unreadCount)
    } catch (requestError) {
      setNotificationsError(requestError?.message || 'Failed to load notifications.')
    } finally {
      setNotificationsLoading(false)
    }
  }

  useEffect(() => {
    loadTasksAndProjects()
    loadNotifications()
  }, [])

  const stats = useMemo(() => {
    const open = tasks.filter((task) => ['draft', 'open', 'in_progress', 'waiting_client'].includes(task.status)).length
    const done = tasks.filter((task) => task.status === 'done').length
    return { open, done }
  }, [tasks])

  async function handleMarkAllRead() {
    if (markingRead || unreadCount === 0) return
    setMarkingRead(true)
    try {
      await markAllNotificationsRead()
      setNotifications([])
      setUnreadCount(0)
    } catch (requestError) {
      setNotificationsError(requestError?.message || 'Failed to mark notifications as read.')
    } finally {
      setMarkingRead(false)
    }
  }

  return (
    <AppShell title="Client Dashboard" navItems={NAV_BY_ROLE[USER_ROLES.CLIENT]}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Open Tasks">
          <p className="text-2xl font-semibold text-slate-900">{stats.open}</p>
        </Card>
        <Card title="Completed Tasks">
          <p className="text-2xl font-semibold text-slate-900">{stats.done}</p>
        </Card>
        <Card title="Unread Updates">
          <p className="text-2xl font-semibold text-slate-900">{unreadCount}</p>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Recent Updates">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500">Admin activity on your tasks</p>
            <Button type="button" variant="ghost" onClick={handleMarkAllRead} disabled={markingRead || unreadCount === 0}>
              Mark all read
            </Button>
          </div>
          {notificationsLoading ? <PageState>Loading notifications...</PageState> : null}
          {!notificationsLoading && notificationsError ? <PageState>{notificationsError}</PageState> : null}
          {!notificationsLoading && !notificationsError && notifications.length === 0 ? <PageState>No updates yet.</PageState> : null}
          {!notificationsLoading && !notificationsError && notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((item) => (
                <Link
                  key={item.id}
                  to={item.task_id ? `/client/tasks/${item.task_id}` : '/client/dashboard'}
                  className={`block rounded-sm border px-3 py-2 transition hover:border-accent/60 ${Number(item.is_read) ? 'border-slate-200 bg-white' : 'border-accent/40 bg-accent/5'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{item.message}</p>
                </Link>
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      <div className="mt-4">
        <ClientTaskCreateCard projects={projects} onTaskCreated={loadTasksAndProjects} />
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
