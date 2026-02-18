const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

let csrfToken = null

export function setCsrfToken(token) {
  csrfToken = typeof token === 'string' && token.trim() !== '' ? token.trim() : null
}

export function getCsrfToken() {
  return csrfToken
}

export function getApiBaseUrl() {
  return API_BASE_URL
}

export class ApiError extends Error {
  constructor(message, { status = 500, code = 'api_error', details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError('Unexpected server response.', {
        status: response.status,
        code: 'unexpected_response',
      })
    }
    return null
  }

  const payload = await response.json()

  if (!response.ok) {
    throw new ApiError(payload?.message || 'Request failed.', {
      status: response.status,
      code: payload?.error || 'request_failed',
      details: payload,
    })
  }

  return payload
}

export async function http(path, { method = 'GET', body, headers = {}, withCsrf = false, signal } = {}) {
  const requestHeaders = {
    ...headers,
  }

  let requestBody = body
  if (body && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json'
    requestBody = JSON.stringify(body)
  }

  if (withCsrf && csrfToken) {
    requestHeaders['X-CSRF-Token'] = csrfToken
  }

  const response = await fetch(buildUrl(path), {
    method,
    credentials: 'include',
    headers: requestHeaders,
    body: requestBody,
    signal,
  })

  return parseResponse(response)
}
