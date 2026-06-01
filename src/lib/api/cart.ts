import { request } from './client'
import type {
  ApiResponse,
  CartItem,
  AddCartItemBody,
  UpdateCartItemBody,
} from '@/types'

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
