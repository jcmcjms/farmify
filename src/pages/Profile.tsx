import { useState, type FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from '@/hooks/useForm'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { User, Save } from 'lucide-react'

/**
 * Profile page — view and edit user information.
 */
export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { success, error: toastError } = useToast()

  const { form, errors, setField, validate } = useForm({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!validate({
      name: (v) => !v.trim() ? 'Name is required' : undefined,
    })) return

    setSaving(true)
    try {
      await updateProfile({
        name: form.name,
        phone: form.phone || undefined,
        address: form.address || undefined,
      })
      setMessage('Profile updated successfully!')
      success('Profile updated', 'Your changes have been saved.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile'
      setError(msg)
      toastError('Update failed', msg)
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  const roleColors: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
    farmer: 'success',
    buyer: 'secondary',
    admin: 'warning',
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-foreground mb-8">My Profile</h1>

      {/* Profile header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <User className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Badge variant={roleColors[user.role] || 'default'} className="capitalize">
                  {user.role}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Member since {formatDate(user.created_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Save className="size-5" />
            Edit Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {message && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              error={errors.name}
            />

            {/* Email is read-only */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="flex h-9 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                {user.email}
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>

            <Input
              label="Phone"
              type="tel"
              placeholder="+63 912 345 6789"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
            />

            <Textarea
              label="Address"
              placeholder="Your full address"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              rows={3}
            />

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
