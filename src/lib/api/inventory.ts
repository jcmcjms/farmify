import { request } from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  InventoryItem,
  InventoryTransaction,
  CreateInventoryItemBody,
  AddTransactionBody,
} from '@/types'

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
