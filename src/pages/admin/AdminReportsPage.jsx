import { useEffect, useMemo, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import PageState from '../../components/ui/PageState'
import { getClients } from '../../lib/api/clients'
import { getProjects } from '../../lib/api/projects'
import { getReportsSummary } from '../../lib/api/reports'
import { NAV_BY_ROLE } from '../../lib/constants/navigation'
import { USER_ROLES } from '../../lib/constants/roles'
import { formatCurrency, formatHours } from '../../lib/utils/format'

const INITIAL_FILTERS = {
  from: '',
  to: '',
  client_id: '',
  project_id: '',
  task_type: '',
  invoice_status: '',
}

export default function AdminReportsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)

  useEffect(() => {
    let active = true

    async function loadMeta() {
      try {
        const [clientsData, projectsData] = await Promise.all([getClients(), getProjects()])
        if (!active) return
        setClients(clientsData)
        setProjects(projectsData)
      } catch (requestError) {
        if (!active) return
        setError(requestError?.message || 'Failed to load report filters.')
      }
    }

    loadMeta()

    return () => {
      active = false
    }
  }, [])

  async function loadReport(currentFilters) {
    setLoading(true)
    setError('')
    try {
      const data = await getReportsSummary(currentFilters)
      setReport(data)
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load report summary.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport(INITIAL_FILTERS)
  }, [])

  function handleChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function handleApply(event) {
    event.preventDefault()
    loadReport(filters)
  }

  function handleReset() {
    setFilters(INITIAL_FILTERS)
    loadReport(INITIAL_FILTERS)
  }

  const totals = useMemo(() => {
    return {
      estimatedHours: formatHours(report?.estimated_hours_total || 0),
      actualHours: formatHours(report?.actual_hours_total || 0),
      estimatedCost: formatCurrency(report?.estimated_cost_total || 0),
      actualCost: formatCurrency(report?.actual_cost_total || 0),
    }
  }, [report])

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }

  function handleExportPdf() {
    if (!report) return

    const popup = window.open('', '_blank', 'width=1024,height=768')
    if (!popup) return

    const appliedFilters = [
      ['From', filters.from || '-'],
      ['To', filters.to || '-'],
      ['Client', clients.find((item) => String(item.id) === String(filters.client_id))?.name || 'All'],
      ['Project', projects.find((item) => String(item.id) === String(filters.project_id))?.name || 'All'],
      ['Task Type', filters.task_type || 'All'],
      ['Invoice Status', filters.invoice_status || 'All'],
    ]

    const rows = (report.breakdown || [])
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.client_name)}</td>
            <td>${escapeHtml(item.project_name)}</td>
            <td>${escapeHtml(item.task_type)}</td>
            <td>${escapeHtml(item.tasks_count)}</td>
            <td>${escapeHtml(formatHours(item.estimated_hours))}</td>
            <td>${escapeHtml(formatHours(item.actual_hours))}</td>
            <td>${escapeHtml(formatCurrency(item.estimated_cost))}</td>
            <td>${escapeHtml(formatCurrency(item.actual_cost))}</td>
          </tr>
        `,
      )
      .join('')

    popup.document.write(`
      <html>
        <head>
          <title>CRM Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin: 0 0 12px; }
            .meta { margin-bottom: 16px; font-size: 12px; color: #475569; }
            .totals { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 16px 0; }
            .card { border: 1px solid #cbd5e1; padding: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>Client CRM Report</h1>
          <p class="meta">Generated: ${new Date().toLocaleString()}</p>
          <div class="meta">
            ${appliedFilters.map(([label, value]) => `<div><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>`).join('')}
          </div>
          <div class="totals">
            <div class="card"><strong>Estimated Hours:</strong> ${escapeHtml(totals.estimatedHours)}</div>
            <div class="card"><strong>Actual Hours:</strong> ${escapeHtml(totals.actualHours)}</div>
            <div class="card"><strong>Estimated Cost:</strong> ${escapeHtml(totals.estimatedCost)}</div>
            <div class="card"><strong>Actual Cost:</strong> ${escapeHtml(totals.actualCost)}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Project</th>
                <th>Task Type</th>
                <th>Tasks</th>
                <th>Estimated H</th>
                <th>Actual H</th>
                <th>Estimated Cost</th>
                <th>Actual Cost</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="8">No data</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `)
    popup.document.close()
    popup.focus()
    popup.print()
  }

  return (
    <AppShell title="Reports" navItems={NAV_BY_ROLE[USER_ROLES.ADMIN]}>
      <Card title="Filters">
        <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" onSubmit={handleApply}>
          <Input type="date" value={filters.from} onChange={(event) => handleChange('from', event.target.value)} />
          <Input type="date" value={filters.to} onChange={(event) => handleChange('to', event.target.value)} />
          <select className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm" value={filters.client_id} onChange={(event) => handleChange('client_id', event.target.value)}>
            <option value="">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <select className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm" value={filters.project_id} onChange={(event) => handleChange('project_id', event.target.value)}>
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <select className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm" value={filters.task_type} onChange={(event) => handleChange('task_type', event.target.value)}>
            <option value="">All task types</option>
            <option value="bugfix">bugfix</option>
            <option value="implementation">implementation</option>
            <option value="new_feature">new_feature</option>
            <option value="maintenance">maintenance</option>
          </select>
          <select className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm" value={filters.invoice_status} onChange={(event) => handleChange('invoice_status', event.target.value)}>
            <option value="">All invoice statuses</option>
            <option value="draft">draft</option>
            <option value="sent">sent</option>
            <option value="paid">paid</option>
          </select>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="submit" variant="primary">Apply</Button>
            <Button type="button" variant="ghost" onClick={handleReset}>Reset</Button>
            <Button type="button" variant="ghost" onClick={handleExportPdf} disabled={!report || loading}>
              Export PDF
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Estimated Hours">
          <p className="text-h2 font-display text-text">{totals.estimatedHours}</p>
        </Card>
        <Card title="Actual Hours">
          <p className="text-h2 font-display text-text">{totals.actualHours}</p>
        </Card>
        <Card title="Estimated Cost">
          <p className="text-h2 font-display text-text">{totals.estimatedCost}</p>
        </Card>
        <Card title="Actual Cost">
          <p className="text-h2 font-display text-text">{totals.actualCost}</p>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Breakdown by Client / Project / Task Type">
          {loading ? <PageState>Loading report...</PageState> : null}
          {!loading && error ? <PageState>{error}</PageState> : null}
          {!loading && !error && (!report?.breakdown || report.breakdown.length === 0) ? <PageState>No report data for selected filters.</PageState> : null}
          {!loading && !error && report?.breakdown?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-2">Client</th>
                    <th className="px-2 py-2">Project</th>
                    <th className="px-2 py-2">Task Type</th>
                    <th className="px-2 py-2">Tasks</th>
                    <th className="px-2 py-2">Estimated H</th>
                    <th className="px-2 py-2">Actual H</th>
                    <th className="px-2 py-2">Estimated Cost</th>
                    <th className="px-2 py-2">Actual Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {report.breakdown.map((item, index) => (
                    <tr key={`${item.client_id}-${item.project_id}-${item.task_type}-${index}`} className="border-b border-slate-100 text-slate-700">
                      <td className="px-2 py-2">{item.client_name}</td>
                      <td className="px-2 py-2">{item.project_name}</td>
                      <td className="px-2 py-2">{item.task_type}</td>
                      <td className="px-2 py-2">{item.tasks_count}</td>
                      <td className="px-2 py-2">{formatHours(item.estimated_hours)}</td>
                      <td className="px-2 py-2">{formatHours(item.actual_hours)}</td>
                      <td className="px-2 py-2">{formatCurrency(item.estimated_cost)}</td>
                      <td className="px-2 py-2">{formatCurrency(item.actual_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      </div>
    </AppShell>
  )
}
