export default function TaskFilters({ filters, onChange, showProject = false, projects = [] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <input
        value={filters.q || ''}
        onChange={(event) => onChange('q', event.target.value)}
        placeholder="Search title..."
        className="rounded border border-slate-300 px-3 py-2 text-sm"
      />
      <select
        value={filters.status || ''}
        onChange={(event) => onChange('status', event.target.value)}
        className="rounded border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">All statuses</option>
        <option value="draft">draft</option>
        <option value="open">open</option>
        <option value="in_progress">in_progress</option>
        <option value="waiting_client">waiting_client</option>
        <option value="done">done</option>
        <option value="cancelled">cancelled</option>
      </select>
      <select
        value={filters.task_type || ''}
        onChange={(event) => onChange('task_type', event.target.value)}
        className="rounded border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">All task types</option>
        <option value="bugfix">bugfix</option>
        <option value="implementation">implementation</option>
        <option value="new_feature">new_feature</option>
        <option value="maintenance">maintenance</option>
      </select>
      <select
        value={filters.invoice_status || ''}
        onChange={(event) => onChange('invoice_status', event.target.value)}
        className="rounded border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">All invoice statuses</option>
        <option value="draft">draft</option>
        <option value="sent">sent</option>
        <option value="paid">paid</option>
      </select>
      {showProject ? (
        <select
          value={filters.project_id || ''}
          onChange={(event) => onChange('project_id', event.target.value)}
          className="rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  )
}
