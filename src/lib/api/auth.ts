import { request } from './client'
import type {
  ApiResponse,
  User,
  LoginBody,
  RegisterBody,
  UpdateProfileBody,
  VerificationStatus,
} from '@/types'

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

  getVerification: () =>
    request<ApiResponse<VerificationStatus>>('/auth/verification'),

  submitVerification: (formData: FormData) =>
    request<ApiResponse<VerificationStatus>>('/auth/verification', {
      method: 'POST',
      body: formData,
      headers: {},
    }),

  resubmitVerification: (formData: FormData) =>
    request<ApiResponse<VerificationStatus>>('/auth/verification', {
      method: 'PUT',
      body: formData,
      headers: {},
    }),
}
