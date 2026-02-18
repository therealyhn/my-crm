import { Link } from 'react-router-dom'
import { formatDate, formatHours } from '../../lib/utils/format'

export default function TaskTable({ tasks, detailBasePath }) {
  if (!tasks || tasks.length === 0) {
    return <p className="text-sm text-slate-500">No new tasks found.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-2 py-2">Title</th>
            <th className="px-2 py-2">Project</th>
            <th className="px-2 py-2">Status</th>
            <th className="px-2 py-2">Type</th>
            <th className="px-2 py-2">Estimate</th>
            <th className="px-2 py-2">Invoice</th>
            <th className="px-2 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-slate-100 text-slate-700">
              <td className="px-2 py-2">
                <Link className="font-medium text-slate-900 hover:underline" to={`${detailBasePath}/${task.id}`}>
                  {task.title}
                </Link>
              </td>
              <td className="px-2 py-2">{task.project_name || '-'}</td>
              <td className="px-2 py-2">{task.status}</td>
              <td className="px-2 py-2">{task.task_type}</td>
              <td className="px-2 py-2">{formatHours(task.estimated_hours)}</td>
              <td className="px-2 py-2">{task.invoice_status}</td>
              <td className="px-2 py-2">{formatDate(task.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
