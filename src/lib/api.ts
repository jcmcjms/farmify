import type {
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
  User,
  Product,
  Order,
  CartItem,
  Job,
  JobApplication,
  InventoryItem,
  InventoryTransaction,
  LoginBody,
  RegisterBody,
  UpdateProfileBody,
  CreateProductBody,
  CreateOrderBody,
  UpdateOrderStatusBody,
  CreateJobBody,
  ApplyJobBody,
  UpdateApplicationStatusBody,
  CreateInventoryItemBody,
  AddTransactionBody,
  AddCartItemBody,
  UpdateCartItemBody,
} from '@/types'

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
    'Content-Type': 'application/json',
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

// ── Auth API ──────────────────────────────────────────────────────────

export const authApi = {
  login: (body: LoginBody) =>
    request<ApiResponse<{ user: User; token: string }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  register: (body: RegisterBody) =>
    request<ApiResponse<{ user: User; token: string }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMe: () =>
    request<ApiResponse<User>>('/auth/me'),

  updateProfile: (body: UpdateProfileBody) =>
    request<ApiResponse<User>>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
}

// ── Products API ──────────────────────────────────────────────────────

export const productsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<PaginatedResponse<Product>>(`/products${query}`)
  },

  getById: (id: number) =>
    request<ApiResponse<Product>>(`/products/${id}`),

  create: (body: CreateProductBody) =>
    request<ApiResponse<Product>>('/products', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: number, body: Partial<CreateProductBody>) =>
    request<ApiResponse<Product>>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: number) =>
    request<ApiResponse<void>>(`/products/${id}`, {
      method: 'DELETE',
    }),
}

// ── Cart API ──────────────────────────────────────────────────────────

export const cartApi = {
  getCart: () =>
    request<ApiResponse<CartItem[]>>('/cart'),

  addItem: (body: AddCartItemBody) =>
    request<ApiResponse<CartItem>>('/cart', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateItem: (id: number, body: UpdateCartItemBody) =>
    request<ApiResponse<CartItem>>(`/cart/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  removeItem: (id: number) =>
    request<ApiResponse<void>>(`/cart/${id}`, {
      method: 'DELETE',
    }),

  clearCart: () =>
    request<ApiResponse<void>>('/cart', {
      method: 'DELETE',
    }),
}

// ── Orders API ────────────────────────────────────────────────────────

export const ordersApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<PaginatedResponse<Order>>(`/orders${query}`)
  },

  getById: (id: number) =>
    request<ApiResponse<Order>>(`/orders/${id}`),

  create: (body: CreateOrderBody) =>
    request<ApiResponse<Order>>('/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateStatus: (id: number, body: UpdateOrderStatusBody) =>
    request<ApiResponse<Order>>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
}

// ── Jobs API ──────────────────────────────────────────────────────────

export const jobsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<PaginatedResponse<Job>>(`/jobs${query}`)
  },

  getById: (id: number) =>
    request<ApiResponse<Job>>(`/jobs/${id}`),

  create: (body: CreateJobBody) =>
    request<ApiResponse<Job>>('/jobs', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: number, body: Partial<CreateJobBody>) =>
    request<ApiResponse<Job>>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: number) =>
    request<ApiResponse<void>>(`/jobs/${id}`, {
      method: 'DELETE',
    }),

  apply: (id: number, body: ApplyJobBody) =>
    request<ApiResponse<JobApplication>>(`/jobs/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getApplications: (id: number) =>
    request<ApiResponse<JobApplication[]>>(`/jobs/${id}/applications`),

  updateApplicationStatus: (jobId: number, applicationId: number, body: UpdateApplicationStatusBody) =>
    request<ApiResponse<JobApplication>>(`/jobs/${jobId}/applications/${applicationId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
}

// ── Inventory API ─────────────────────────────────────────────────────

export const inventoryApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<PaginatedResponse<InventoryItem>>(`/inventory${query}`)
  },

  getById: (id: number) =>
    request<ApiResponse<InventoryItem>>(`/inventory/${id}`),

  create: (body: CreateInventoryItemBody) =>
    request<ApiResponse<InventoryItem>>('/inventory', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: number, body: Partial<CreateInventoryItemBody>) =>
    request<ApiResponse<InventoryItem>>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: number) =>
    request<ApiResponse<void>>(`/inventory/${id}`, {
      method: 'DELETE',
    }),

  getTransactions: (id: number) =>
    request<ApiResponse<InventoryTransaction[]>>(`/inventory/${id}/transactions`),

  addTransaction: (id: number, body: AddTransactionBody) =>
    request<ApiResponse<InventoryTransaction>>(`/inventory/${id}/transactions`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

// ── Dashboard / Stats API ─────────────────────────────────────────────

export const dashboardApi = {
  getStats: () =>
    request<ApiResponse<Record<string, number>>>('/dashboard/stats'),
}

// ── Admin API ──────────────────────────────────────────────────────────

export const adminApi = {
  getUsers: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<ApiResponse<User[]> & { pagination: PaginationMeta }>(`/admin/users${query}`)
  },
  getUser: (id: number) =>
    request<ApiResponse<User & { stats: Record<string, number> }>>(`/admin/users/${id}`),
  createUser: (body: { name: string; email: string; password: string; role: string; phone?: string; address?: string }) =>
    request<ApiResponse<User>>('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: number, body: { name?: string; email?: string; role?: string; phone?: string; address?: string }) =>
    request<ApiResponse<User>>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id: number) =>
    request<ApiResponse<void>>(`/admin/users/${id}`, { method: 'DELETE' }),
  resetPassword: (id: number) =>
    request<ApiResponse<{ new_password: string }>>(`/admin/users/${id}/reset-password`, { method: 'PUT' }),
  getRoles: () =>
    request<ApiResponse<Array<{ name: string; description: string; user_count: number; permissions: string[] }>>>('/admin/roles'),
  getStats: () =>
    request<ApiResponse<Record<string, number>>>('/admin/stats'),
}
