import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import CommentList from '../../components/comments/CommentList'
import AttachmentList from '../../components/attachments/AttachmentList'
import Card from '../../components/ui/Card'
import PageState from '../../components/ui/PageState'
import { createComment, getComments } from '../../lib/api/comments'
import { getAttachments, uploadAttachment } from '../../lib/api/attachments'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'
import { getApiBaseUrl } from '../../lib/api/http'
import { getTaskById } from '../../lib/api/tasks'
import { getTimeLogs } from '../../lib/api/timelogs'
import { formatCurrency, formatDate, formatHours } from '../../lib/utils/format'

export default function ClientTaskDetailPage() {
  const { id } = useParams()
  const taskId = Number(id)

  const [task, setTask] = useState(null)
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [timeLogs, setTimeLogs] = useState([])
  const [commentBody, setCommentBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const attachmentBase = getApiBaseUrl()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [taskData, commentsData, attachmentData] = await Promise.all([
        getTaskById(taskId),
        getComments(taskId),
        getAttachments(taskId),
      ])
      const shouldShowTimeLogs = taskData?.status === 'done' || taskData?.status === 'cancelled'
      const timeLogData = shouldShowTimeLogs ? await getTimeLogs(taskId) : []
      setTask(taskData)
      setComments(commentsData)
      setAttachments(attachmentData)
      setTimeLogs(timeLogData)
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load task details.')
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    if (Number.isNaN(taskId) || taskId <= 0) {
      setError('Invalid task id.')
      setLoading(false)
      return
    }
    loadData()
  }, [taskId, loadData])

  async function handleCommentSubmit(event) {
    event.preventDefault()
    if (!commentBody.trim()) return
    try {
      await createComment(taskId, commentBody.trim())
      setCommentBody('')
      setComments(await getComments(taskId))
    } catch (requestError) {
      setError(requestError?.message || 'Comment create failed.')
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await uploadAttachment(taskId, file)
      setAttachments(await getAttachments(taskId))
    } catch (requestError) {
      setError(requestError?.message || 'Upload failed.')
    } finally {
      event.target.value = ''
    }
  }

  function labelize(value) {
    if (!value) return '-'
    return String(value).replaceAll('_', ' ')
  }

  function badgeTone(kind, value) {
    if (kind === 'status') {
      if (value === 'done') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
      if (value === 'in_progress') return 'border-blue-200 bg-blue-50 text-blue-800'
      if (value === 'waiting_client') return 'border-amber-200 bg-amber-50 text-amber-800'
      if (value === 'cancelled') return 'border-rose-200 bg-rose-50 text-rose-800'
      return 'border-slate-300 bg-white text-slate-700'
    }

    if (kind === 'priority') {
      if (value === 'urgent') return 'border-rose-200 bg-rose-50 text-rose-800'
      if (value === 'high') return 'border-orange-200 bg-orange-50 text-orange-800'
      if (value === 'medium') return 'border-amber-200 bg-amber-50 text-amber-800'
      return 'border-slate-300 bg-white text-slate-700'
    }

    if (kind === 'invoice') {
      if (value === 'paid') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
      if (value === 'sent') return 'border-sky-200 bg-sky-50 text-sky-800'
      return 'border-slate-300 bg-white text-slate-700'
    }

    return 'border-slate-300 bg-white text-slate-700'
  }

  const isCompletedTask = task?.status === 'done' || task?.status === 'cancelled'
  const actualHoursTotal = timeLogs.reduce((sum, item) => sum + ((Number(item.minutes) || 0) / 60), 0)
  const hourlyRate = Number(task?.hourly_rate_override)
  const hasHourlyRate = task?.hourly_rate_override !== null && task?.hourly_rate_override !== undefined && !Number.isNaN(hourlyRate)
  const actualPayable = isCompletedTask && hasHourlyRate ? actualHoursTotal * hourlyRate : null

  return (
    <AppShell title="Task Details" navItems={NAV_BY_ROLE[USER_ROLES.CLIENT]}>
      {loading ? <PageState>Loading task...</PageState> : null}
      {!loading && error ? <PageState>{error}</PageState> : null}
      {!loading && !error && task ? (
        <div className="space-y-4">
          <Card title={task.title}>
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-slate-700">{task.description || 'No description'}</p>

              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badgeTone('status', task.status)}`}>
                  Status: {labelize(task.status)}
                </span>
                <span className={`inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badgeTone('priority', task.priority)}`}>
                  Priority: {labelize(task.priority)}
                </span>
                <span className={`inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badgeTone('invoice', task.invoice_status)}`}>
                  Invoice: {labelize(task.invoice_status)}
                </span>
                <span className="inline-flex items-center rounded-sm border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-violet-800">
                  Type: {labelize(task.task_type)}
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-sm border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated Hours</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{task.estimated_hours ?? '-'}</p>
                  <p className="mt-1 text-xs text-slate-500">Approximate only. Final hours show after completion.</p>
                </div>
                <div className="rounded-sm border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actual Hours</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{isCompletedTask ? formatHours(actualHoursTotal) : '-'}</p>
                </div>
                <div className="rounded-sm border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hourly Rate</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {task.hourly_rate_override !== null && task.hourly_rate_override !== undefined ? formatCurrency(task.hourly_rate_override) : '-'}
                  </p>
                </div>
                <div className="rounded-sm border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{task.project_name || '-'}</p>
                </div>
                <div className="rounded-sm border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount Due</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {isCompletedTask
                      ? (task.billable ? (actualPayable !== null ? formatCurrency(actualPayable) : '-') : 'Non-billable')
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p><span className="font-medium text-slate-900">Created:</span> {formatDate(task.created_at)}</p>
                <p><span className="font-medium text-slate-900">Updated:</span> {formatDate(task.updated_at)}</p>
              </div>
            </div>
          </Card>

          <Card title="Comments">
            <form className="mb-3 flex gap-2" onSubmit={handleCommentSubmit}>
              <input className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm" value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="Write comment..." />
              <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Add</button>
            </form>
            <CommentList comments={comments} />
          </Card>

          <Card title="Attachments">
            <div className="mb-3">
              <input type="file" onChange={handleFileChange} className="text-sm" />
            </div>
            <AttachmentList attachments={attachments} attachmentBase={attachmentBase} />
          </Card>

          {isCompletedTask ? (
            <Card title="Time Logs">
              {timeLogs.length === 0 ? (
                <p className="text-sm text-slate-500">No time logs recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {timeLogs.map((item) => (
                    <li key={item.id} className="rounded-sm border border-slate-200 bg-white p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">{item.user_name || 'User'}</p>
                        <p className="text-slate-700">{formatHours((Number(item.minutes) || 0) / 60)} h</p>
                      </div>
                      <p className="mt-1 text-slate-700">{item.note || 'No note'}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(item.log_date)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  )
}
