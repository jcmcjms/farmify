import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCardSkeleton } from '@/components/ui/skeleton'
import { dashboardApi, authApi } from '@/lib/api'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Briefcase01Icon, Clock01Icon, DangerIcon, NaturalFoodIcon, PackageIcon, PlusSignIcon, ShoppingBag01Icon, WarehouseIcon } from '@hugeicons/core-free-icons'

interface DashboardStats {
  total_products?: number
  active_jobs?: number
  inventory_items?: number
  orders_received?: number
  orders_placed?: number
  cart_items?: number
}

/**
 * Dashboard page with role-based stats and quick actions.
 */
export default function Dashboard() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({})
  const [loading, setLoading] = useState(true)
  const [error] = useState('')
  const [farmerVerificationStatus, setFarmerVerificationStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Admins belong in the admin panel, not the user dashboard
    if (user?.role === 'admin') {
      navigate('/admin')
      return
    }

    const fetchStats = async () => {
      try {
        const res = await dashboardApi.getStats()
        if (res.data) {
          setStats(res.data)
        }
      } catch {
        // Stats are optional, use defaults
      } finally {
        setLoading(false)
      }
    }

    const fetchVerification = async () => {
      if (user?.role === 'farmer') {
        try {
          const vRes = await authApi.getVerification()
          if (vRes.data) setFarmerVerificationStatus(vRes.data.status)
        } catch {
          // Farmer not verified yet — status stays null
        }
      }
    }

    fetchStats()
    fetchVerification()
  }, [isAuthenticated, navigate, user?.role])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        <Skeleton className="h-8 w-64 mb-1" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  const isFarmer = user?.role === 'farmer'

  const farmerStatCards = [
    {
      title: 'My Products',
      value: stats.total_products ?? 0,
      icon: PackageIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/marketplace',
      action: 'Manage Products',
    },
    {
      title: 'Active Jobs',
      value: stats.active_jobs ?? 0,
      icon: Briefcase01Icon,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      link: '/jobs',
      action: 'View Jobs',
    },
    {
      title: 'Inventory Items',
      value: stats.inventory_items ?? 0,
      icon: WarehouseIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      link: '/inventory',
      action: 'Manage Inventory',
    },
    {
      title: 'Orders Received',
      value: stats.orders_received ?? 0,
      icon: ShoppingBag01Icon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/orders',
      action: 'View Orders',
    },
  ]

  const buyerStatCards = [
    {
      title: 'Orders Placed',
      value: stats.orders_placed ?? 0,
      icon: ShoppingBag01Icon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/orders',
      action: 'View Orders',
    },
    {
      title: 'Cart Items',
      value: stats.cart_items ?? 0,
      icon: PackageIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/cart',
      action: 'View Cart',
    },
  ]

  const statCards = isFarmer ? farmerStatCards : buyerStatCards

  const quickActions = isFarmer
    ? [
        { label: 'Add Product', icon: PlusSignIcon, link: '/marketplace', color: 'text-green-600' },
        { label: 'Post a Job', icon: Briefcase01Icon, link: '/jobs/new', color: 'text-amber-600' },
        { label: 'Add Inventory', icon: WarehouseIcon, link: '/inventory/new', color: 'text-emerald-600' },
      ]
    : [
        { label: 'Browse Products', icon: PackageIcon, link: '/marketplace', color: 'text-green-600' },
        { label: 'View Cart', icon: ShoppingBag01Icon, link: '/cart', color: 'text-blue-600' },
        { label: 'Find Jobs', icon: Briefcase01Icon, link: '/jobs', color: 'text-amber-600' },
      ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground font-display">
          Welcome back, {user?.name?.split(' ')[0] || 'Farmer'}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening with your farm today.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Verification Status Card for Farmers */}
      {user?.role === 'farmer' && farmerVerificationStatus && farmerVerificationStatus !== 'verified' && (
        <Card className={`mb-6 border ${
          farmerVerificationStatus === 'pending'
            ? 'bg-amber-50 border-amber-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <CardContent className="p-4 flex items-center gap-3">
            {farmerVerificationStatus === 'pending' ? (
              <HugeiconsIcon icon={Clock01Icon} className="size-5 text-amber-600 shrink-0" />
            ) : (
              <HugeiconsIcon icon={DangerIcon} className="size-5 text-red-600 shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">
                {farmerVerificationStatus === 'pending'
                  ? 'Your verification is being reviewed'
                  : 'Complete your farmer verification'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {farmerVerificationStatus === 'pending'
                  ? 'Your documents are under review. You will be able to sell once approved.'
                  : 'Verify your farmer account to start selling products and posting jobs.'}
              </p>
            </div>
            <Link to="/verification">
              <Button variant="outline" size="sm">
                {farmerVerificationStatus === 'pending' ? 'View Status' : 'Verify Now'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {statCards.map((stat) => (
          <Card key={stat.title} className="transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`rounded-xl ${stat.bgColor} p-3 ${stat.color}`}>
                  <HugeiconsIcon icon={stat.icon} className="size-6" />
                </div>
              </div>
              <Link
                to={stat.link}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {stat.action}
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.link}>
                <Button
                  variant="outline"
                  className="w-full h-20 flex-col gap-2"
                >
                  <HugeiconsIcon icon={action.icon} className={`size-5 ${action.color}`} />
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role-based info card */}
      <Card className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6 flex items-center gap-4">
          <HugeiconsIcon icon={NaturalFoodIcon} className="size-10 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-foreground">
              {isFarmer
                ? 'Tip: Keep your inventory up-to-date to get accurate stock alerts.'
                : 'Tip: Browse the marketplace to discover fresh produce from local farmers.'}
            </p>
            <Link
              to={isFarmer ? '/inventory' : '/marketplace'}
              className="text-sm text-primary hover:underline mt-1 inline-block"
            >
              {isFarmer ? 'Go to Inventory' : 'Browse Marketplace'} &rarr;
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
