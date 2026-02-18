import { formatDate, formatHours } from '../../lib/utils/format'

export default function TimeLogList({ timeLogs }) {
  if (!timeLogs || timeLogs.length === 0) {
    return <p className="text-sm text-slate-500">No time logs yet.</p>
  }

  return (
    <ul className="space-y-2">
      {timeLogs.map((item) => (
        <li key={item.id} className="rounded border border-slate-200 p-3 text-sm">
          <p className="font-medium text-slate-900">
            {item.user_name || 'User'} � {formatHours((item.minutes || 0) / 60)} h
          </p>
          <p className="text-slate-700">{item.note || 'No note'}</p>
          <p className="text-xs text-slate-500">{formatDate(item.log_date)}</p>
        </li>
      ))}
    </ul>
  )
}
