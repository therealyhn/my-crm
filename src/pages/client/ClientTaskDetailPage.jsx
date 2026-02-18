import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import CommentList from '../../components/comments/CommentList'
import Card from '../../components/ui/Card'
import PageState from '../../components/ui/PageState'
import { createComment, getComments } from '../../lib/api/comments'
import { getAttachments, uploadAttachment } from '../../lib/api/attachments'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'
import { getApiBaseUrl } from '../../lib/api/http'
import { getTaskById } from '../../lib/api/tasks'
import { formatDate } from '../../lib/utils/format'

export default function ClientTaskDetailPage() {
  const { id } = useParams()
  const taskId = Number(id)

  const [task, setTask] = useState(null)
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
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
      setTask(taskData)
      setComments(commentsData)
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

  return (
    <AppShell title="Task Details" navItems={NAV_BY_ROLE[USER_ROLES.CLIENT]}>
      {loading ? <PageState>Loading task...</PageState> : null}
      {!loading && error ? <PageState>{error}</PageState> : null}
      {!loading && !error && task ? (
        <div className="space-y-4">
          <Card title={task.title}>
            <p className="text-sm text-slate-700">{task.description || 'No description'}</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>Status: {task.status}</p>
              <p>Priority: {task.priority}</p>
              <p>Invoice status: {task.invoice_status}</p>
              <p>Created: {formatDate(task.created_at)}</p>
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
            {attachments.length === 0 ? <p className="text-sm text-slate-500">No attachments yet.</p> : null}
            {attachments.length > 0 ? (
              <ul className="space-y-2">
                {attachments.map((attachment) => (
                  <li key={attachment.id} className="rounded border border-slate-200 p-2 text-sm">
                    <a className="font-medium text-slate-900 hover:underline" href={`${attachmentBase}/attachments/${attachment.id}`} target="_blank" rel="noreferrer">
                      {attachment.original_name}
                    </a>
                    <p className="text-xs text-slate-500">{attachment.mime_type} - {formatDate(attachment.created_at)}</p>
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