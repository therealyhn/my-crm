import { formatDate } from '../../lib/utils/format'

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatDate(value)
  return date.toLocaleString()
}

function formatRoleLabel(role) {
  if (!role) return 'User'
  if (role === 'admin') return 'Admin'
  if (role === 'client') return 'Client'
  return role
}

export default function CommentList({ comments }) {
  if (!comments || comments.length === 0) {
    return <p className="text-sm text-slate-500">No comments yet.</p>
  }

  return (
    <ul className="space-y-2">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-sm border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">{comment.author_name || 'User'}</p>
            <span className="inline-flex items-center rounded-sm border border-slate-300 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {formatRoleLabel(comment.author_role)}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{comment.body}</p>
          <p className="mt-2 text-xs text-slate-500">{formatDateTime(comment.created_at)}</p>
        </li>
      ))}
    </ul>
  )
}
