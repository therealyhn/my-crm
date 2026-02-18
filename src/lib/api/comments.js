import { http } from './http'

export async function getComments(taskId) {
  const payload = await http(`/tasks/${taskId}/comments`)
  return Array.isArray(payload?.data) ? payload.data : []
}

export async function createComment(taskId, body) {
  const payload = await http(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: { body },
    withCsrf: true,
  })
  return payload?.data || null
}
