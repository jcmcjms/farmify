/**
 * Re-export all API modules from the new domain-specific structure.
 *
 * Existing imports from `@/lib/api` continue to work unchanged:
 *   import { authApi, productsApi, request } from '@/lib/api'
 */
export { request } from './api/client'
export { authApi } from './api/auth'
export { productsApi } from './api/products'
export { cartApi } from './api/cart'
export { ordersApi } from './api/orders'
export { jobsApi } from './api/jobs'
export { inventoryApi } from './api/inventory'
export { dashboardApi } from './api/dashboard'
export { adminApi } from './api/admin'
export { deliveriesApi } from './api/deliveries'
export { driversApi } from './api/drivers'
export { farmerDriversApi } from './api/farmer-drivers'
