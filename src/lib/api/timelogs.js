import { http } from './http'

export async function getTimeLogs(taskId) {
  const payload = await http(`/tasks/${taskId}/timelogs`)
  return Array.isArray(payload?.data) ? payload.data : []
}

export async function createTimeLog(taskId, input) {
  const payload = await http(`/tasks/${taskId}/timelogs`, {
    method: 'POST',
    body: input,
    withCsrf: true,
  })
  return payload?.data || null
}
