import { http } from './http'

export async function getAttachments(taskId) {
  const payload = await http(`/tasks/${taskId}/attachments`)
  return Array.isArray(payload?.data) ? payload.data : []
}

export async function uploadAttachment(taskId, file) {
  const body = new FormData()
  body.append('file', file)
  const payload = await http(`/tasks/${taskId}/attachments`, {
    method: 'POST',
    body,
    withCsrf: true,
  })
  return payload?.data || null
}

export async function deleteAttachment(attachmentId) {
  const payload = await http(`/attachments/${attachmentId}`, {
    method: 'DELETE',
    withCsrf: true,
  })
  return payload?.data || null
}
