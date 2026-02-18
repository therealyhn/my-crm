import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import CommentList from '../../components/comments/CommentList'
import TimeLogList from '../../components/timelogs/TimeLogList'
import Card from '../../components/ui/Card'
import PageState from '../../components/ui/PageState'
import { createComment, getComments } from '../../lib/api/comments'
import { deleteAttachment, getAttachments, uploadAttachment } from '../../lib/api/attachments'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'
import { getApiBaseUrl } from '../../lib/api/http'
import { getTaskById, updateTask, updateTaskStatus } from '../../lib/api/tasks'
import { createTimeLog, getTimeLogs } from '../../lib/api/timelogs'
import { formatDate } from '../../lib/utils/format'

export default function AdminTaskDetailPage() {
  const { id } = useParams()
  const taskId = Number(id)

  const [task, setTask] = useState(null)
  const [comments, setComments] = useState([])
  const [timeLogs, setTimeLogs] = useState([])
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [timeLogMinutes, setTimeLogMinutes] = useState('')
  const [timeLogNote, setTimeLogNote] = useState('')
  const [uploading, setUploading] = useState(false)

  const attachmentBase = getApiBaseUrl()

  const loadTaskData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [taskData, commentsData, timeLogData, attachmentData] = await Promise.all([
        getTaskById(taskId),
        getComments(taskId),
        getTimeLogs(taskId),
        getAttachments(taskId),
      ])
      setTask(taskData)
      setComments(commentsData)
      setTimeLogs(timeLogData)
      setAttachments(attachmentData)
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
    loadTaskData()
  }, [taskId, loadTaskData])

  async function handleStatusChange(event) {
    const status = event.target.value
    try {
      await updateTaskStatus(taskId, status)
      await loadTaskData()
    } catch (requestError) {
      setError(requestError?.message || 'Status update failed.')
    }
  }

  async function handleBillingUpdate(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      await updateTask(taskId, {
        estimated_hours: formData.get('estimated_hours') || null,
        hourly_rate_override: formData.get('hourly_rate_override') || null,
        invoice_status: formData.get('invoice_status') || 'draft',
      })
      await loadTaskData()
    } catch (requestError) {
      setError(requestError?.message || 'Task update failed.')
    }
  }

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

  async function handleTimeLogSubmit(event) {
    event.preventDefault()
    if (!timeLogMinutes) return
    try {
      await createTimeLog(taskId, {
        minutes: Number(timeLogMinutes),
        note: timeLogNote.trim() || null,
      })
      setTimeLogMinutes('')
      setTimeLogNote('')
      setTimeLogs(await getTimeLogs(taskId))
    } catch (requestError) {
      setError(requestError?.message || 'Time log create failed.')
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadAttachment(taskId, file)
      setAttachments(await getAttachments(taskId))
    } catch (requestError) {
      setError(requestError?.message || 'Upload failed.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function handleDeleteAttachment(attachmentId) {
    try {
      await deleteAttachment(attachmentId)
      setAttachments(await getAttachments(taskId))
    } catch (requestError) {
      setError(requestError?.message || 'Delete attachment failed.')
    }
  }

  const timeLoggedHours = useMemo(() => {
    return (timeLogs || []).reduce((total, item) => total + Number(item.minutes || 0), 0) / 60
  }, [timeLogs])

  return (
    <AppShell title="Task Details" navItems={NAV_BY_ROLE[USER_ROLES.ADMIN]}>
      {loading ? <PageState>Loading task...</PageState> : null}
      {!loading && error ? <PageState>{error}</PageState> : null}
      {!loading && !error && task ? (
        <div className="space-y-4">
          <Card title={task.title}>
            <p className="text-sm text-slate-700">{task.description || 'No description'}</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
              <p>Status: {task.status}</p>
              <p>Priority: {task.priority}</p>
              <p>Type: {task.task_type}</p>
              <p>Invoice: {task.invoice_status}</p>
            </div>
            <div className="mt-3">
              <label className="mr-2 text-sm font-medium">Update status:</label>
              <select className="rounded border border-slate-300 px-2 py-1 text-sm" value={task.status} onChange={handleStatusChange}>
                <option value="draft">draft</option>
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="waiting_client">waiting_client</option>
                <option value="done">done</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          </Card>

          <Card title="Billing Controls">
            <form className="grid gap-2 sm:grid-cols-3" onSubmit={handleBillingUpdate}>
              <input name="estimated_hours" defaultValue={task.estimated_hours || ''} type="number" min="0" step="0.01" className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Estimated hours" />
              <input name="hourly_rate_override" defaultValue={task.hourly_rate_override || ''} type="number" min="0" step="0.01" className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Hourly rate override" />
              <select name="invoice_status" defaultValue={task.invoice_status || 'draft'} className="rounded border border-slate-300 px-3 py-2 text-sm">
                <option value="draft">draft</option>
                <option value="sent">sent</option>
                <option value="paid">paid</option>
              </select>
              <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">Save Billing</button>
            </form>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Comments">
              <form className="mb-3 flex gap-2" onSubmit={handleCommentSubmit}>
                <input className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm" value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="Write comment..." />
                <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Add</button>
              </form>
              <CommentList comments={comments} />
            </Card>

            <Card title={`Time Logs (${timeLoggedHours.toFixed(2)} h)`}>
              <form className="mb-3 grid gap-2 sm:grid-cols-3" onSubmit={handleTimeLogSubmit}>
                <input className="rounded border border-slate-300 px-3 py-2 text-sm" type="number" min="1" value={timeLogMinutes} onChange={(event) => setTimeLogMinutes(event.target.value)} placeholder="Minutes" />
                <input className="rounded border border-slate-300 px-3 py-2 text-sm sm:col-span-2" value={timeLogNote} onChange={(event) => setTimeLogNote(event.target.value)} placeholder="Note" />
                <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm text-white sm:col-span-3">Add Time Log</button>
              </form>
              <TimeLogList timeLogs={timeLogs} />
            </Card>
          </div>

          <Card title="Attachments">
            <div className="mb-3 flex items-center gap-3">
              <input type="file" onChange={handleFileChange} className="text-sm" />
              <span className="text-xs text-slate-500">{uploading ? 'Uploading...' : ''}</span>
            </div>
            {attachments.length === 0 ? <p className="text-sm text-slate-500">No attachments yet.</p> : null}
            {attachments.length > 0 ? (
              <ul className="space-y-2">
                {attachments.map((attachment) => (
                  <li key={attachment.id} className="flex items-center justify-between rounded border border-slate-200 p-2 text-sm">
                    <div>
                      <a className="font-medium text-slate-900 hover:underline" href={`${attachmentBase}/attachments/${attachment.id}`} target="_blank" rel="noreferrer">
                        {attachment.original_name}
                      </a>
                      <p className="text-xs text-slate-500">{attachment.mime_type} - {formatDate(attachment.created_at)}</p>
                    </div>
                    <button type="button" onClick={() => handleDeleteAttachment(attachment.id)} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100">
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        </div>
      ) : null}
    </AppShell>
  )
}