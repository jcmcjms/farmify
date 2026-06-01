import { request } from './client'
import type { ApiResponse } from '@/types'

export const dashboardApi = {
  getStats: () =>
    request<ApiResponse<Record<string, number>>>('/dashboard/stats'),
}
