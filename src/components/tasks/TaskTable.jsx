import { Link } from 'react-router-dom'
import { formatDate, formatHours } from '../../lib/utils/format'

export default function TaskTable({
  tasks,
  detailBasePath,
  showClient = false,
  showDelete = false,
  deletingTaskId = null,
  onDelete = null,
}) {
  if (!tasks || tasks.length === 0) {
    return <p className="text-sm text-slate-500">No new tasks found.</p>
  }

  function labelize(value) {
    if (!value) return '-'
    return String(value).replaceAll('_', ' ')
  }

  function statusTone(value) {
    if (value === 'done') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    if (value === 'in_progress') return 'border-blue-200 bg-blue-50 text-blue-800'
    if (value === 'waiting_client') return 'border-amber-200 bg-amber-50 text-amber-800'
    if (value === 'cancelled') return 'border-rose-200 bg-rose-50 text-rose-800'
    return 'border-slate-300 bg-white text-slate-700'
  }

  function invoiceTone(value) {
    if (value === 'paid') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    if (value === 'sent') return 'border-sky-200 bg-sky-50 text-sky-800'
    return 'border-slate-300 bg-white text-slate-700'
  }

  function priorityTone(value) {
    if (value === 'urgent') return 'border-rose-200 bg-rose-50 text-rose-800'
    if (value === 'high') return 'border-orange-200 bg-orange-50 text-orange-800'
    if (value === 'medium') return 'border-amber-200 bg-amber-50 text-amber-800'
    return 'border-slate-300 bg-white text-slate-700'
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-slate-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2">Title</th>
            {showClient ? <th className="px-3 py-2">Client</th> : null}
            <th className="px-3 py-2">Project</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Priority</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Estimate</th>
            <th className="px-3 py-2">Invoice</th>
            <th className="px-3 py-2">Created</th>
            {showDelete ? <th className="px-3 py-2 text-right">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const isFullyCompleted = ['done', 'cancelled'].includes(task.status) && task.invoice_status === 'paid'

            return (
              <tr key={task.id} className="border-b border-slate-100 bg-white text-slate-700 hover:bg-slate-50/70">
                <td className="px-3 py-2">
                  <div className="flex flex-col items-start gap-1">
                    <Link className="font-medium text-slate-900 hover:underline" to={`${detailBasePath}/${task.id}`}>
                      {task.title}
                    </Link>
                    {isFullyCompleted ? (
                      <span className="inline-flex items-center rounded-sm border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                        Completed
                      </span>
                    ) : null}
                  </div>
                </td>
                {showClient ? <td className="px-3 py-2">{task.client_name || '-'}</td> : null}
                <td className="px-3 py-2">{task.project_name || '-'}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusTone(task.status)}`}>
                    {labelize(task.status)}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${priorityTone(task.priority)}`}>
                    {labelize(task.priority)}
                  </span>
                </td>
                <td className="px-3 py-2">{labelize(task.task_type)}</td>
                <td className="px-3 py-2">{formatHours(task.estimated_hours)}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${invoiceTone(task.invoice_status)}`}>
                    {labelize(task.invoice_status)}
                  </span>
                </td>
                <td className="px-3 py-2">{formatDate(task.created_at)}</td>
                {showDelete ? (
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete?.(task)}
                      disabled={deletingTaskId === task.id}
                      className="inline-flex items-center justify-center rounded-sm border border-red-400 bg-red-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {deletingTaskId === task.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
