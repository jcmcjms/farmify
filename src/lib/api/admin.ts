import { request } from "./client";
import type {
  ApiResponse,
  PaginationMeta,
  User,
  VerificationListItem,
  FarmerProfile,
  VerificationDocument,
} from "@/types";

export const adminApi = {
  getUsers: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<ApiResponse<User[]> & { pagination: PaginationMeta }>(
      `/admin/users${query}`,
    );
  },
  getUser: (id: number) =>
    request<ApiResponse<User & { stats: Record<string, number> }>>(
      `/admin/users/${id}`,
    ),
  createUser: (body: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    address?: string;
  }) =>
    request<ApiResponse<User>>("/admin/users", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateUser: (
    id: number,
    body: {
      name?: string;
      email?: string;
      role?: string;
      phone?: string;
      address?: string;
    },
  ) =>
    request<ApiResponse<User>>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteUser: (id: number) =>
    request<ApiResponse<void>>(`/admin/users/${id}`, { method: "DELETE" }),
  resetPassword: (id: number) =>
    request<ApiResponse<{ new_password: string }>>(
      `/admin/users/${id}/reset-password`,
      { method: "PUT" },
    ),
  getRoles: () =>
    request<
      ApiResponse<
        Array<{
          name: string;
          description: string;
          user_count: number;
          permissions: string[];
        }>
      >
    >("/admin/roles"),
  getStats: () => request<ApiResponse<Record<string, number>>>("/admin/stats"),

  getVerifications: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<
      ApiResponse<VerificationListItem[]> & { pagination: PaginationMeta }
    >(`/admin/verifications${query}`);
  },
  getVerificationDetail: (id: number) =>
    request<
      ApiResponse<{
        farmer: User;
        profile: FarmerProfile;
        documents: VerificationDocument[];
      }>
    >(`/admin/verifications/${id}`),
  approveVerification: (id: number) =>
    request<ApiResponse<void>>(`/admin/verifications/${id}/approve`, {
      method: "PUT",
    }),
  rejectVerification: (id: number, reason: string) =>
    request<ApiResponse<void>>(`/admin/verifications/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    }),
};
