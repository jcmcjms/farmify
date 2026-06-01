import { request } from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Order,
  CreateOrderBody,
  UpdateOrderStatusBody,
} from '@/types'

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
