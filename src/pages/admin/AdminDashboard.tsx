import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageSpinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import { adminApi } from '@/lib/api'
import { Users, Package, ShoppingBag, Briefcase, Sprout, Shield, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface AdminStats {
  total_users?: number
  total_products?: number
  total_orders?: number
  total_jobs?: number
  total_revenue?: number
}

const statCards: {
  key: keyof AdminStats
  label: string
  icon: typeof Users
  color: string
  bgColor: string
  format?: (val: number) => string
}[] = [
  {
    key: 'total_users',
    label: 'Total Users',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    key: 'total_products',
    label: 'Total Products',
    icon: Package,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    key: 'total_orders',
    label: 'Total Orders',
    icon: ShoppingBag,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  {
    key: 'total_jobs',
    label: 'Total Jobs',
    icon: Briefcase,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    key: 'total_revenue',
    label: 'Total Revenue',
    icon: Sprout,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    format: (val: number) => formatCurrency(val),
  },
]

/**
 * Admin dashboard showing system-wide statistics.
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminApi.getStats()
        if (res.data) {
          setStats(res.data)
        }
      } catch {
        setError('Unable to load statistics.')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) return <PageSpinner text="Loading admin dashboard..." />

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          System-wide overview and management controls.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-muted border border-border p-4 text-sm text-muted-foreground">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const value = stats[stat.key]
          const displayValue = value !== undefined
            ? stat.format
              ? stat.format(value)
              : value.toLocaleString()
            : '—'

          return (
            <Card key={stat.key} className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{displayValue}</p>
                  </div>
                  <div className={`rounded-xl ${stat.bgColor} p-3 ${stat.color}`}>
                    <stat.icon className="size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Management Navigation */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">Management</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/admin/users">
            <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                  <Users className="size-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">User Management</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Create, edit, and manage all users in the system. Reset passwords and control roles.
                  </p>
                </div>
                <ArrowRight className="size-5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/roles">
            <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                  <Shield className="size-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Roles &amp; Permissions</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    View role definitions, user counts, and the permissions granted to each role.
                  </p>
                </div>
                <ArrowRight className="size-5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
