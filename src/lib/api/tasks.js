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

export async function getTasks(filters = {}) {
  const payload = await http(`/tasks${toQuery(filters)}`)
  return Array.isArray(payload?.data) ? payload.data : []
}

export async function getTaskById(id) {
  const payload = await http(`/tasks/${id}`)
  return payload?.data || null
}

export async function createTask(input) {
  const payload = await http('/tasks', {
    method: 'POST',
    body: input,
    withCsrf: true,
  })
  return payload?.data || null
}

export async function updateTask(id, input) {
  const payload = await http(`/tasks/${id}`, {
    method: 'PUT',
    body: input,
    withCsrf: true,
  })
  return payload?.data || null
}

export async function updateTaskStatus(id, status) {
  const payload = await http(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: { status },
    withCsrf: true,
  })
  return payload?.data || null
}
