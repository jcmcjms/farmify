import { request } from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Product,
  CreateProductBody,
} from '@/types'

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
