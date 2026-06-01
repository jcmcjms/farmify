const BASE_URL = '/api'

/**
 * Get auth token from localStorage.
 */
function getToken(): string | null {
  return localStorage.getItem('farmify_token')
}

/**
 * Generic fetch wrapper with error handling and auth.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> | undefined),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle 401 — redirect to login
  if (response.status === 401) {
    localStorage.removeItem('farmify_token')
    localStorage.removeItem('farmify_user')
    window.location.href = '/login'
    throw new Error('Session expired. Please log in again.')
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`)
  }

  return data as T
}

export { request }
