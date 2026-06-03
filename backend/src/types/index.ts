import { Request } from 'express';

// ── Database Entity Types ──────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'farmer' | 'buyer' | 'admin' | 'driver';
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  farmer_id: number;
  name: string;
  description: string | null;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  image_url: string | null;
  is_organic: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  buyer_id: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'ready_for_pickup' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
}

export interface Job {
  id: number;
  farmer_id: number;
  title: string;
  description: string;
  category: string;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_type: 'fixed' | 'daily' | 'hourly' | 'negotiable';
  employment_type: 'full-time' | 'part-time' | 'seasonal' | 'contract' | 'temporary';
  requirements: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: number;
  job_id: number;
  applicant_id: number;
  cover_letter: string | null;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'accepted' | 'rejected';
  created_at: string;
}

export interface InventoryItem {
  id: number;
  farmer_id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  unit_cost: number;
  supplier: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: number;
  item_id: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  created_at: string;
}

// ── Delivery Types ────────────────────────────────────────────────────

export interface DriverProfile {
  id?: number;
  user_id: number;
  vehicle_type: 'bike' | 'motorcycle' | 'car' | 'truck' | 'van';
  vehicle_plate: string;
  service_area: string;
  service_radius_km: number;
  is_available: boolean;
  is_verified: boolean;
  verification_document_url: string | null;
  rating: number;
  total_deliveries: number;
  current_lat: number | null;
  current_lng: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Delivery {
  id: number;
  order_id: number;
  driver_id: number | null;
  farmer_id: number;
  status: 'waiting_assignment' | 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  assigned_at: string | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  pickup_notes: string | null;
  delivery_notes: string | null;
  driver_rating: number | null;
  buyer_rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface FarmerDriver {
  farmer_id: number;
  driver_id: number;
  is_preferred: boolean;
  nickname: string | null;
  created_at: string;
}

// ── API Response Types ─────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// ── Request Body Types ─────────────────────────────────────────────────

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  role?: 'farmer' | 'buyer' | 'driver';
  phone?: string;
  address?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface UpdateProfileBody {
  name?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
}

export interface CreateProductBody {
  name: string;
  description?: string;
  category: string;
  price: number;
  unit?: string;
  quantity?: number;
  image_url?: string;
  is_organic?: boolean;
  is_available?: boolean;
}

export interface UpdateProductBody {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  unit?: string;
  quantity?: number;
  image_url?: string;
  is_organic?: boolean;
  is_available?: boolean;
}

export interface CreateOrderBody {
  items: { product_id: number; quantity: number }[];
  shipping_address?: string;
  payment_method?: string;
  notes?: string;
}

export interface UpdateOrderStatusBody {
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

export interface CreateJobBody {
  title: string;
  description: string;
  category: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: 'fixed' | 'daily' | 'hourly' | 'negotiable';
  employment_type?: 'full-time' | 'part-time' | 'seasonal' | 'contract' | 'temporary';
  requirements?: string;
  is_active?: boolean;
}

export interface UpdateJobBody {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: 'fixed' | 'daily' | 'hourly' | 'negotiable';
  employment_type?: 'full-time' | 'part-time' | 'seasonal' | 'contract' | 'temporary';
  requirements?: string;
  is_active?: boolean;
}

export interface ApplyJobBody {
  cover_letter?: string;
}

export interface UpdateApplicationStatusBody {
  status: 'pending' | 'reviewed' | 'shortlisted' | 'accepted' | 'rejected';
}

export interface CreateInventoryItemBody {
  name: string;
  category: string;
  quantity?: number;
  unit?: string;
  min_quantity?: number;
  unit_cost?: number;
  supplier?: string;
  notes?: string;
}

export interface UpdateInventoryItemBody {
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  min_quantity?: number;
  unit_cost?: number;
  supplier?: string;
  notes?: string;
}

export interface AddTransactionBody {
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
}

export interface AddCartItemBody {
  product_id: number;
  quantity?: number;
}

export interface UpdateCartItemBody {
  quantity: number;
}

// ── Query Param Types ──────────────────────────────────────────────────

export interface ProductQueryParams {
  category?: string;
  farmer_id?: string;
  search?: string;
  is_organic?: string;
  page?: string;
  limit?: string;
}

export interface OrderQueryParams {
  page?: string;
  limit?: string;
  status?: string;
}

export interface JobQueryParams {
  category?: string;
  location?: string;
  employment_type?: string;
  is_active?: string;
  page?: string;
  limit?: string;
}

export interface InventoryQueryParams {
  farmer_id?: string;
  category?: string;
  page?: string;
  limit?: string;
}

// ── Express Request Extension ──────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: 'farmer' | 'buyer' | 'admin' | 'driver';
  };
}

// ── JWT Payload ────────────────────────────────────────────────────────

export interface JwtPayload {
  id: number;
  name: string;
  email: string;
  role: 'farmer' | 'buyer' | 'admin' | 'driver';
  iat?: number;
  exp?: number;
}
