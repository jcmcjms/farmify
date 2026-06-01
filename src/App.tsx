import { Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { ToastProvider } from '@/context/ToastContext'
import { Layout } from '@/components/layout/Layout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

// Lazy-loaded pages for code splitting
import { lazy, Suspense } from 'react'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { PageSpinner } from '@/components/ui/spinner'

const Landing = lazy(() => import('@/pages/Landing'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Products = lazy(() => import('@/pages/Products'))
const ProductDetail = lazy(() => import('@/pages/ProductDetail'))
const Cart = lazy(() => import('@/pages/Cart'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const Orders = lazy(() => import('@/pages/Orders'))
const OrderDetail = lazy(() => import('@/pages/OrderDetail'))
const Jobs = lazy(() => import('@/pages/Jobs'))
const JobDetail = lazy(() => import('@/pages/JobDetail'))
const PostJob = lazy(() => import('@/pages/PostJob'))
const Inventory = lazy(() => import('@/pages/Inventory'))
const InventoryDetail = lazy(() => import('@/pages/InventoryDetail'))
const NewInventoryItem = lazy(() => import('@/pages/NewInventoryItem'))
const Profile = lazy(() => import('@/pages/Profile'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminRoles = lazy(() => import('@/pages/admin/AdminRoles'))
const FarmerVerification = lazy(() => import('@/pages/FarmerVerification'))
const AdminVerifications = lazy(() => import('@/pages/admin/AdminVerifications'))
const NotFound = lazy(() => import('@/pages/NotFound'))

/**
 * Wrap a component with Suspense for lazy loading.
 */
function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSpinner text="Loading page..." />}>{children}</Suspense>
}

/**
 * Main application with routing setup.
 */
export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
        <Layout>
          <ErrorBoundary>
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                <SuspenseWrapper>
                  <Landing />
                </SuspenseWrapper>
              }
            />
            <Route
              path="/login"
              element={
                <SuspenseWrapper>
                  <Login />
                </SuspenseWrapper>
              }
            />
            <Route
              path="/register"
              element={
                <SuspenseWrapper>
                  <Register />
                </SuspenseWrapper>
              }
            />

            {/* Marketplace */}
            <Route
              path="/marketplace"
              element={
                <SuspenseWrapper>
                  <Products />
                </SuspenseWrapper>
              }
            />
            <Route
              path="/products/:id"
              element={
                <SuspenseWrapper>
                  <ProductDetail />
                </SuspenseWrapper>
              }
            />

            {/* Jobs (public view, protected for posting) */}
            <Route
              path="/jobs"
              element={
                <SuspenseWrapper>
                  <Jobs />
                </SuspenseWrapper>
              }
            />
            <Route
              path="/jobs/:id"
              element={
                <SuspenseWrapper>
                  <JobDetail />
                </SuspenseWrapper>
              }
            />
            <Route
              path="/jobs/new"
              element={
                <ProtectedRoute requiredRole="farmer">
                  <SuspenseWrapper>
                    <PostJob />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:id/edit"
              element={
                <ProtectedRoute requiredRole="farmer">
                  <SuspenseWrapper>
                    <PostJob />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />

            {/* Protected routes — any authenticated user */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <Dashboard />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <Cart />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <Checkout />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <Orders />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <OrderDetail />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <SuspenseWrapper>
                    <Profile />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />

            {/* Farmer-only routes */}
            <Route
              path="/inventory"
              element={
                <ProtectedRoute requiredRole="farmer">
                  <SuspenseWrapper>
                    <Inventory />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/new"
              element={
                <ProtectedRoute requiredRole="farmer">
                  <SuspenseWrapper>
                    <NewInventoryItem />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory/:id"
              element={
                <ProtectedRoute requiredRole="farmer">
                  <SuspenseWrapper>
                    <InventoryDetail />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />

            {/* Verification */}
            <Route
              path="/verification"
              element={
                <ProtectedRoute requiredRole="farmer">
                  <SuspenseWrapper>
                    <FarmerVerification />
                  </SuspenseWrapper>
                </ProtectedRoute>
              }
            />

            {/* Admin routes — wrapped in AdminLayout with sidebar */}
            <Route
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <Outlet />
                  </AdminLayout>
                </ProtectedRoute>
              }
            >
              <Route
                path="/admin"
                element={
                  <SuspenseWrapper>
                    <AdminDashboard />
                  </SuspenseWrapper>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <SuspenseWrapper>
                    <AdminUsers />
                  </SuspenseWrapper>
                }
              />
              <Route
                path="/admin/roles"
                element={
                  <SuspenseWrapper>
                    <AdminRoles />
                  </SuspenseWrapper>
                }
              />
              <Route
                path="/admin/verifications"
                element={
                  <SuspenseWrapper>
                    <AdminVerifications />
                  </SuspenseWrapper>
                }
              />
            </Route>

            {/* 404 */}
            <Route
              path="*"
              element={
                <SuspenseWrapper>
                  <NotFound />
                </SuspenseWrapper>
              }
            />
          </Routes>
          </ErrorBoundary>
        </Layout>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  )
}
