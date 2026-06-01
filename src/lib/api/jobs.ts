import { request } from './client'
import type {
  ApiResponse,
  PaginatedResponse,
  Job,
  JobApplication,
  CreateJobBody,
  ApplyJobBody,
  UpdateApplicationStatusBody,
} from '@/types'

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
