import { formatDate } from '../../lib/utils/format'

function formatBytes(bytes) {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value <= 0) return '-'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(2)} MB`
}

function roleLabel(role) {
  if (role === 'admin') return 'Admin'
  if (role === 'client') return 'Client'
  return 'User'
}

export default function AttachmentList({ attachments = [], attachmentBase, canDelete = false, onDelete }) {
  if (!attachments.length) {
    return <p className="text-sm text-slate-500">No attachments yet.</p>
  }

  return (
    <ul className="space-y-2">
      {attachments.map((attachment) => (
        <li key={attachment.id} className="rounded-sm border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <a
                className="block truncate text-sm font-semibold text-slate-900 hover:underline"
                href={`${attachmentBase}/attachments/${attachment.id}`}
                target="_blank"
                rel="noreferrer"
                title={attachment.original_name}
              >
                {attachment.original_name}
              </a>
              <p className="mt-1 text-xs text-slate-600">
                Uploaded by {attachment.uploaded_by_name || 'User'} ({roleLabel(attachment.uploaded_by_role)})
              </p>
              <p className="text-xs text-slate-500">
                {attachment.mime_type || '-'} · {formatBytes(attachment.size_bytes)} · {formatDate(attachment.created_at)}
              </p>
            </div>
            {canDelete ? (
              <button
                type="button"
                onClick={() => onDelete?.(attachment.id)}
                className="rounded-sm border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
              >
                Delete
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}
