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

export async function getNotifications(filters = {}) {
  const payload = await http(`/notifications${toQuery(filters)}`)
  return {
    data: Array.isArray(payload?.data) ? payload.data : [],
    unreadCount: Number(payload?.meta?.unread_count || 0),
  }
}

export async function markAllNotificationsRead() {
  const payload = await http('/notifications/read-all', {
    method: 'POST',
    withCsrf: true,
    body: {},
  })
  return Number(payload?.data?.updated || 0)
}
