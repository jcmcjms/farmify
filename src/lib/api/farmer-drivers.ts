import { request } from './client'
import type { ApiResponse, FarmerDriver } from '@/types'

export const farmerDriversApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<ApiResponse<FarmerDriver[]>>(`/farmer/drivers${query}`)
  },

  add: (driverId: number) =>
    request<ApiResponse<FarmerDriver>>('/farmer/drivers', {
      method: 'POST',
      body: JSON.stringify({ driver_id: driverId }),
    }),

  remove: (driverId: number) =>
    request<ApiResponse<void>>(`/farmer/drivers/${driverId}`, { method: 'DELETE' }),

  togglePreferred: (driverId: number) =>
    request<ApiResponse<FarmerDriver>>(`/farmer/drivers/${driverId}/preferred`, { method: 'PATCH' }),
}
