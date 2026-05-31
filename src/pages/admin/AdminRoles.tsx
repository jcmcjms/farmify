import { useState, useEffect } from 'react'
import { PageSpinner } from '@/components/ui/spinner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { adminApi } from '@/lib/api'
import { Shield, Building2, UserCheck, Check } from 'lucide-react'

interface Role {
  name: string
  description: string
  user_count: number
  permissions: string[]
}

const permissionLabels: Record<string, string> = {
  'users.manage': 'Manage Users',
  'products.manage': 'Manage All Products',
  'products.create': 'Create Products',
  'products.edit': 'Edit Products',
  'products.delete': 'Delete Products',
  'products.view': 'View Products',
  'orders.manage': 'Manage All Orders',
  'orders.create': 'Place Orders',
  'orders.view': 'View Orders',
  'jobs.manage': 'Manage All Jobs',
  'jobs.create': 'Post Jobs',
  'jobs.edit': 'Edit Jobs',
  'jobs.delete': 'Delete Jobs',
  'jobs.apply': 'Apply for Jobs',
  'inventory.manage': 'Manage Inventory',
  'cart.manage': 'Manage Cart',
}

function formatPermission(code: string): string {
  if (permissionLabels[code]) return permissionLabels[code]
  return code
    .split('.')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getRoleIcon(name: string) {
  switch (name.toLowerCase()) {
    case 'admin':
      return { icon: Shield, color: 'text-red-600', bg: 'bg-red-100' }
    case 'farmer':
      return { icon: Building2, color: 'text-green-600', bg: 'bg-green-100' }
    case 'buyer':
      return { icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-100' }
    default:
      return { icon: Shield, color: 'text-muted-foreground', bg: 'bg-muted' }
  }
}

/**
 * Admin roles & permissions overview page.
 */
export default function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await adminApi.getRoles()
        if (res.data) {
          setRoles(res.data)
        }
      } catch {
        // Roles failed silently
      } finally {
        setLoading(false)
      }
    }

    fetchRoles()
  }, [])

  if (loading) return <PageSpinner text="Loading roles..." />

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Roles &amp; Permissions</h1>
        <p className="mt-1 text-muted-foreground">
          View the roles available in the system and their associated permissions.
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const { icon: RoleIcon, color, bg } = getRoleIcon(role.name)
          return (
            <Card key={role.name} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl ${bg} p-3 ${color}`}>
                    <RoleIcon className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="capitalize">{role.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {role.user_count} user{role.user_count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{role.description}</p>

                {role.permissions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Permissions</h4>
                    <ul className="space-y-1.5">
                      {role.permissions.map((perm) => (
                        <li
                          key={perm}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="size-4 mt-0.5 shrink-0 text-green-600" />
                          <span>{formatPermission(perm)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty state */}
      {roles.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Shield className="size-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">No roles found.</p>
        </div>
      )}
    </div>
  )
}
