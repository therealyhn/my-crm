import { useEffect, useMemo, useState } from 'react'
import { createTask } from '../../lib/api/tasks'
import { uploadAttachment } from '../../lib/api/attachments'
import Button from '../ui/Button'

const INITIAL_FORM = {
  project_id: '',
  title: '',
  description: '',
  priority: 'medium',
  task_type: 'implementation',
}

export default function ClientTaskCreateCard({ projects = [], defaultProjectId = null, onTaskCreated }) {
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedImages, setSelectedImages] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)

  const fallbackProjectId = useMemo(() => {
    if (defaultProjectId && Number(defaultProjectId) > 0) {
      return String(defaultProjectId)
    }
    if (projects.length > 0) {
      return String(projects[0].id)
    }
    return ''
  }, [defaultProjectId, projects])

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      project_id: prev.project_id || fallbackProjectId,
    }))
  }, [fallbackProjectId])

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    const projectId = Number(form.project_id || fallbackProjectId)
    if (!projectId || projectId <= 0) {
      setError('Please select a project first.')
      return
    }

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

      setForm({
        ...INITIAL_FORM,
        project_id: String(projectId),
      })
      setSelectedImages([])
      setIsOpen(false)

      if (typeof onTaskCreated === 'function') {
        await onTaskCreated()
      }
    } catch (requestError) {
      setError(requestError?.message || 'Task creation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={() => setIsOpen(true)} disabled={projects.length === 0}>
          Add Task
        </Button>
        {projects.length === 0 ? <p className="text-xs text-slate-500">No available projects.</p> : null}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-2xl rounded-sm border border-border bg-surface p-4 shadow-frame">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-display text-h3 text-text">Add Task</h3>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
            <div className="mb-3 h-px w-full bg-slate-300/80" />

            {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

            <form className="grid gap-2 sm:grid-cols-2" onSubmit={handleSubmit}>
              {projects.length > 1 ? (
                <select
                  className="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                  value={form.project_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, project_id: event.target.value }))}
                  required
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : null}

              <input
                className="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                placeholder="Task title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
              <textarea
                className="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                placeholder="Description"
                rows={3}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <select
                className="rounded border border-slate-300 px-3 py-2 text-sm"
                value={form.priority}
                onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </select>
              <select
                className="rounded border border-slate-300 px-3 py-2 text-sm"
                value={form.task_type}
                onChange={(event) => setForm((prev) => ({ ...prev, task_type: event.target.value }))}
              >
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
                <p className="mt-1 text-xs text-slate-500">Optional images while creating task.</p>
              </div>
              <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-70 sm:col-span-2" disabled={submitting} type="submit">
                {submitting ? 'Creating...' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
