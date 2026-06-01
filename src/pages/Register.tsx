import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from '@/hooks/useForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sprout, UserPlus } from 'lucide-react'

const roleOptions = [
  { value: 'farmer', label: 'Farmer' },
  { value: 'buyer', label: 'Buyer' },
]

/**
 * Register page with full form validation.
 */
export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const { form, errors, setField, validate } = useForm({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'farmer' as 'farmer' | 'buyer',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validate({
      name: (v) => !v?.trim() ? 'Name is required' : undefined,
      email: (v) => !v?.trim() ? 'Email is required' : !/\S+@\S+\.\S+/.test(v) ? 'Invalid email format' : undefined,
      password: (v) => !v ? 'Password is required' : v.length < 6 ? 'Password must be at least 6 characters' : undefined,
      confirmPassword: (_, f) => !f.confirmPassword ? 'Please confirm your password' : f.password !== f.confirmPassword ? 'Passwords do not match' : undefined,
      role: (v) => !v ? 'Please select a role' : undefined,
    })) return

    setLoading(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone || undefined,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
            <Sprout className="size-8" />
            Farmify
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>Join Farmify and start growing</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Input
                label="Full Name"
                placeholder="Juan Dela Cruz"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                error={errors.name}
                autoComplete="name"
              />

              <Input
                label="Email"
                type="email"
                placeholder="farmer@example.com"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                error={errors.email}
                autoComplete="email"
              />

              <Input
                label="Phone (optional)"
                type="tel"
                placeholder="+63 912 345 6789"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                autoComplete="tel"
              />

              <Select
                label="I want to join as"
                value={form.role}
                onChange={(e) => setField('role', e.target.value)}
                options={roleOptions}
                error={errors.role}
              />

              <Input
                label="Password"
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                error={errors.password}
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => setField('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  'Creating account...'
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
