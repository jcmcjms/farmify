import { request } from './client'
import type { ApiResponse, PaginatedResponse, DriverProfile, Delivery } from '@/types'

export const driversApi = {
  getProfile: () =>
    request<ApiResponse<DriverProfile>>('/drivers/profile'),

  updateProfile: (body: Partial<DriverProfile>) =>
    request<ApiResponse<DriverProfile>>('/drivers/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  toggleAvailability: (available: boolean) =>
    request<ApiResponse<DriverProfile>>('/drivers/availability', {
      method: 'PATCH',
      body: JSON.stringify({ is_available: available }),
    }),

  getDeliveries: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<PaginatedResponse<Delivery>>(`/drivers/deliveries${query}`)
  },
}
