import { formatDate } from '../../lib/utils/format'

export default function CommentList({ comments }) {
  if (!comments || comments.length === 0) {
    return <p className="text-sm text-slate-500">No comments yet.</p>
  }

  return (
    <ul className="space-y-2">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded border border-slate-200 p-3">
          <p className="text-sm text-slate-800">{comment.body}</p>
          <p className="mt-1 text-xs text-slate-500">
            {comment.author_name || 'User'} ({comment.author_role || 'user'}) - {formatDate(comment.created_at)}
          </p>
        </li>
      ))}
    </ul>
  )
}
