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

export async function getProjects(filters = {}) {
  const payload = await http(`/projects${toQuery(filters)}`)
  return Array.isArray(payload?.data) ? payload.data : []
}

export async function getProjectById(id) {
  const payload = await http(`/projects/${id}`)
  return payload?.data || null
}

export async function createProject(input) {
  const payload = await http('/projects', {
    method: 'POST',
    body: input,
    withCsrf: true,
  })
  return payload?.data || null
}
