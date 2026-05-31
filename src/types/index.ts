// ── Database Entity Types ──────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'farmer' | 'buyer' | 'admin';
  phone?: string | null;
  address?: string | null;
  avatar_url?: string | null;
  created_at: string;
}

export interface Product {
  id: number;
  farmer_id: number;
  farmer_name?: string;
  name: string;
  description?: string | null;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  image_url?: string | null;
  is_organic: boolean;
  is_available: boolean;
  created_at: string;
}

export interface Order {
  id: number;
  buyer_id: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  items?: OrderItem[];
  buyer_name?: string;
  shipping_address?: string | null;
  payment_method?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id?: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  product?: Product;
  created_at: string;
}

export interface Job {
  id: number;
  farmer_id: number;
  farmer_name?: string;
  title: string;
  description: string;
  category: string;
  location?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_type: 'fixed' | 'daily' | 'hourly' | 'negotiable';
  employment_type: 'full-time' | 'part-time' | 'seasonal' | 'contract' | 'temporary';
  requirements?: string | null;
  is_active: boolean;
  applications_count?: number;
  created_at: string;
}

export interface JobApplication {
  id: number;
  job_id: number;
  applicant_id: number;
  applicant_name?: string;
  cover_letter?: string | null;
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
  supplier?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface InventoryTransaction {
  id: number;
  item_id: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_type?: string | null;
  reference_id?: number | null;
  notes?: string | null;
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
  role?: 'farmer' | 'buyer';
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
