import { http, setCsrfToken } from './http'

export async function fetchCsrfToken() {
  const payload = await http('/csrf-token')
  const token = payload?.data?.csrf_token || null
  if (token) {
    setCsrfToken(token)
  }
  return token
}

export async function login(email, password) {
  const payload = await http('/auth/login', {
    method: 'POST',
    body: { email, password },
  })

  const token = payload?.data?.csrf_token || null
  if (token) {
    setCsrfToken(token)
  }

  return payload?.data?.user || null
}

export async function logout() {
  await http('/auth/logout', {
    method: 'POST',
    withCsrf: true,
  })
  setCsrfToken(null)
}

export async function me() {
  const payload = await http('/auth/me')
  return payload?.data?.user || null
}
