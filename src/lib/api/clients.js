import { http } from './http'

export async function getClients() {
  const payload = await http('/clients')
  return Array.isArray(payload?.data) ? payload.data : []
}

export async function createClient(input) {
  const payload = await http('/clients', {
    method: 'POST',
    body: input,
    withCsrf: true,
  })
  return payload?.data || null
}

export async function deleteClient(id) {
  const payload = await http(`/clients/${id}`, {
    method: 'DELETE',
    withCsrf: true,
  })
  return payload?.data || null
}
