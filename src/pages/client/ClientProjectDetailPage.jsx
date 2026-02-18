import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import TaskTable from '../../components/tasks/TaskTable'
import Card from '../../components/ui/Card'
import PageState from '../../components/ui/PageState'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'
import { getProjectById } from '../../lib/api/projects'
import { createTask, getTasks } from '../../lib/api/tasks'
import { uploadAttachment } from '../../lib/api/attachments'

const INITIAL_FORM = {
  title: '',
  description: '',
  priority: 'medium',
  task_type: 'implementation',
}

export default function ClientProjectDetailPage() {
  const { id } = useParams()
  const projectId = Number(id)

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedImages, setSelectedImages] = useState([])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [projectData, taskData] = await Promise.all([
        getProjectById(projectId),
        getTasks({ project_id: projectId }),
      ])
      setProject(projectData)
      setTasks(taskData)
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load project details.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (Number.isNaN(projectId) || projectId <= 0) {
      setError('Invalid project id.')
      setLoading(false)
      return
    }
    loadData()
  }, [projectId, loadData])

  async function handleCreateTask(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const createdTask = await createTask({
        project_id: projectId,
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        task_type: form.task_type,
        billable: true,
      })

      const taskId = Number(createdTask?.id)
      if (taskId > 0 && selectedImages.length > 0) {
        await Promise.all(selectedImages.map((file) => uploadAttachment(taskId, file)))
      }

      setForm(INITIAL_FORM)
      setSelectedImages([])
      await loadData()
    } catch (requestError) {
      setError(requestError?.message || 'Task creation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell title="Project Details" navItems={NAV_BY_ROLE[USER_ROLES.CLIENT]}>
      {loading ? <PageState>Loading project...</PageState> : null}
      {!loading && error ? <PageState>{error}</PageState> : null}
      {!loading && !error && project ? (
        <div className="space-y-4">
          <Card title={project.name}>
            <p className="text-sm text-slate-700">{project.description || 'No project description.'}</p>
          </Card>

          <Card title="Create Task">
            <form className="grid gap-2 sm:grid-cols-2" onSubmit={handleCreateTask}>
              <input className="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" placeholder="Task title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <textarea className="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" placeholder="Description" rows={3} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
              <select className="rounded border border-slate-300 px-3 py-2 text-sm" value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </select>
              <select className="rounded border border-slate-300 px-3 py-2 text-sm" value={form.task_type} onChange={(event) => setForm((prev) => ({ ...prev, task_type: event.target.value }))}>
                <option value="bugfix">bugfix</option>
                <option value="implementation">implementation</option>
                <option value="maintenance">maintenance</option>
              </select>
              <div className="sm:col-span-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => setSelectedImages(Array.from(event.target.files || []))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Optional: attach one or more images while creating the task.
                </p>
              </div>
              <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-70 sm:col-span-2" disabled={submitting} type="submit">
                {submitting ? 'Creating...' : 'Create Task'}
              </button>
            </form>
          </Card>

          <Card title="Tasks">
            <TaskTable tasks={tasks} detailBasePath="/client/tasks" />
          </Card>
        </div>
      ) : null}
    </AppShell>
  )
}
