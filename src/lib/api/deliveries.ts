import { request } from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Delivery,
} from '@/types'

export const deliveriesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<PaginatedResponse<Delivery>>(`/deliveries${query}`)
  },

  getById: (id: number) =>
    request<ApiResponse<Delivery>>(`/deliveries/${id}`),

  acceptDelivery: (id: number) =>
    request<ApiResponse<Delivery>>(`/deliveries/${id}/accept`, { method: 'POST' }),

  updateStatus: (id: number, status: string, notes?: string) =>
    request<ApiResponse<Delivery>>(`/deliveries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  getByOrder: (orderId: number) =>
    request<ApiResponse<Delivery>>(`/orders/${orderId}/delivery`),
}
