import { http } from './http'

function toQuery(params) {
  const query = new URLSearchParams()
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value))
    }
  })
  const encoded = query.toString()
  return encoded ? `?${encoded}` : ''
}

export async function getReportsSummary(filters = {}) {
  const payload = await http(`/reports/summary${toQuery(filters)}`)
  return payload?.data || {
    estimated_hours_total: 0,
    actual_hours_total: 0,
    estimated_cost_total: 0,
    actual_cost_total: 0,
    breakdown: [],
  }
}
