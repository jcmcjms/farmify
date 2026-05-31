import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { PageSpinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { adminApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Search, Plus, Edit2, Trash2, Key, X, Users, Mail } from 'lucide-react'
import type { User } from '@/types'

// ── Modal Overlay ───────────────────────────────────────────────────────

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-white p-6 shadow-lg">
        {children}
      </div>
    </div>
  )
}

// ── Role Badge Helper ───────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const variantMap: Record<string, 'danger' | 'success' | 'default'> = {
    admin: 'danger',
    farmer: 'success',
    buyer: 'default',
  }
  const variant = variantMap[role] || 'default'
  const labelMap: Record<string, string> = {
    admin: 'Admin',
    farmer: 'Farmer',
    buyer: 'Buyer',
  }
  return <Badge variant={variant}>{labelMap[role] || role}</Badge>
}

// ── Page Component ──────────────────────────────────────────────────────

export default function AdminUsers() {
  const { user: currentUser } = useAuth()

  // Data state
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [resetResult, setResetResult] = useState<{ id: number; password: string } | null>(null)

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getUsers()
      if (res.data) {
        setUsers(res.data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Client-side filtering
  const filteredUsers = useMemo(() => {
    let result = users
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter)
    }
    return result
  }, [users, search, roleFilter])

  if (loading) return <PageSpinner text="Loading users..." />

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="mt-1 text-muted-foreground">
            {users.length} total user{users.length !== 1 ? 's' : ''} in the system.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="size-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="w-full sm:w-44">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="farmer">Farmer</option>
            <option value="buyer">Buyer</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <Users className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                      No users found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{u.id}</td>
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.phone || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingUser(u)}
                            title="Edit user"
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              try {
                                const res = await adminApi.resetPassword(u.id)
                                if (res.data) {
                                  setResetResult({ id: u.id, password: res.data.new_password })
                                }
                              } catch {
                                // silently fail
                              }
                            }}
                            title="Reset password"
                          >
                            <Key className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingUser(u)}
                            disabled={currentUser?.id === u.id}
                            title={currentUser?.id === u.id ? 'Cannot delete yourself' : 'Delete user'}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Create User Modal ── */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchUsers()
          }}
        />
      )}

      {/* ── Edit User Modal ── */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null)
            fetchUsers()
          }}
          onResetPassword={(password) => setResetResult({ id: editingUser.id, password })}
        />
      )}

      {/* ── Delete Confirmation ── */}
      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onSuccess={() => {
            setDeletingUser(null)
            fetchUsers()
          }}
        />
      )}

      {/* ── Reset Password Result ── */}
      {resetResult && (
        <ModalOverlay onClose={() => setResetResult(null)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Password Reset</h2>
              <Button variant="ghost" size="icon" onClick={() => setResetResult(null)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="rounded-md bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-800 font-medium mb-2">
                Password has been reset successfully.
              </p>
              <p className="text-sm text-green-700 mb-1">New temporary password:</p>
              <div className="bg-white rounded border border-green-300 px-3 py-2 font-mono text-sm select-all">
                {resetResult.password}
              </div>
              <p className="text-xs text-green-600 mt-2">
                Copy this password now. It will not be shown again.
              </p>
            </div>
            <Button className="w-full" onClick={() => setResetResult(null)}>
              Done
            </Button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ── Create User Modal ───────────────────────────────────────────────────

function CreateUserModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer',
    phone: '',
    address: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const errs: Record<string, string> = {}
    if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format.'
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.'
    if (!form.role) errs.role = 'Role is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setApiError('')
    try {
      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      }
      await adminApi.createUser(body)
      onSuccess()
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to create user.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Create User</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {apiError && (
        <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          placeholder="John Doe"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
        />
        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 6 characters"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
        />
        <Select
          label="Role"
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'farmer', label: 'Farmer' },
            { value: 'buyer', label: 'Buyer' },
          ]}
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          error={errors.role}
        />
        <Input
          label="Phone"
          placeholder="+63 912 345 6789"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Input
          label="Address"
          placeholder="City, Province"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    </ModalOverlay>
  )
}

// ── Edit User Modal ─────────────────────────────────────────────────────

function EditUserModal({
  user,
  onClose,
  onSuccess,
  onResetPassword,
}: {
  user: User
  onClose: () => void
  onSuccess: () => void
  onResetPassword: (password: string) => void
}) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    address: user.address || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [resetBanner, setResetBanner] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format.'
    if (!form.role) errs.role = 'Role is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setApiError('')
    try {
      await adminApi.updateUser(user.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role as 'farmer' | 'buyer' | 'admin',
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      })
      onSuccess()
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to update user.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetPassword = async () => {
    try {
      const res = await adminApi.resetPassword(user.id)
      if (res.data) {
        setResetBanner(true)
        onResetPassword(res.data.new_password)
      }
    } catch {
      setApiError('Failed to reset password.')
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Edit User</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {apiError && (
        <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {apiError}
        </div>
      )}

      {resetBanner && (
        <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
          Password has been reset. Check the popup for the new password.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          placeholder="John Doe"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
        />
        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />
        <Select
          label="Role"
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'farmer', label: 'Farmer' },
            { value: 'buyer', label: 'Buyer' },
          ]}
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as 'farmer' | 'buyer' | 'admin' })}
          error={errors.role}
        />
        <Input
          label="Phone"
          placeholder="+63 912 345 6789"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Input
          label="Address"
          placeholder="City, Province"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <hr className="my-4 border-border" />

      <div>
        <p className="text-sm font-medium text-foreground mb-2">Reset Password</p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResetPassword}
        >
          <Key className="size-4" />
          Reset Password
        </Button>
      </div>
    </ModalOverlay>
  )
}

// ── Delete User Confirmation ────────────────────────────────────────────

function DeleteUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User
  onClose: () => void
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  const handleDelete = async () => {
    setSubmitting(true)
    setApiError('')
    try {
      await adminApi.deleteUser(user.id)
      onSuccess()
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to delete user.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-destructive">Delete User</h2>

        {apiError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {apiError}
          </div>
        )}

        <div className="rounded-md bg-muted p-4 space-y-1">
          <p className="font-medium">{user.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-3.5" />
            {user.email}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RoleBadge role={user.role} />
          </div>
        </div>

        <div className="rounded-md bg-destructive/5 border border-destructive/20 p-3 text-sm text-destructive">
          This action cannot be undone. All related data (products, orders, jobs) will also be deleted.
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={submitting}
            onClick={handleDelete}
          >
            {submitting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  )
}
