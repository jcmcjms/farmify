import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from '@/hooks/useForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { HugeiconsIcon } from '@hugeicons/react'
import { NaturalFoodIcon, UserAdd01Icon } from '@hugeicons/core-free-icons'

const roleOptions = [
  { value: 'farmer', label: 'Farmer' },
  { value: 'buyer', label: 'Buyer' },
  { value: 'driver', label: 'Delivery Rider' },
]

/**
 * Register page with full form validation.
 */
export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const { form, errors, setField, setFields, validate, validateField } = useForm({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'farmer' as 'farmer' | 'buyer' | 'driver',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const rules = {
    name: (v: string) => !v?.trim() ? 'Name is required' : undefined,
    email: (v: string) => !v?.trim() ? 'Email is required' : !/\S+@\S+\.\S+/.test(v) ? 'Invalid email format' : undefined,
    password: (v: string) => !v ? 'Password is required' : v.length < 6 ? 'Password must be at least 6 characters' : undefined,
    confirmPassword: (v: string, f: Record<string, unknown>) => !f.confirmPassword ? 'Please confirm your password' : f.password !== f.confirmPassword ? 'Passwords do not match' : undefined,
    role: (v: string) => !v ? 'Please select a role' : undefined,
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validate(rules)) return

    setLoading(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone || undefined,
      })
      // Redirect based on role
      if (form.role === 'driver') {
        navigate('/deliveries/dashboard')
        return
      }
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
            <HugeiconsIcon icon={NaturalFoodIcon} className="size-8" />
            Farmify
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-display">Create Your Account</CardTitle>
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

              <PasswordInput
                label="Password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                onBlur={() => validateField(rules, 'password')}
                error={errors.password}
                autoComplete="new-password"
              />

              <PasswordInput
                label="Confirm Password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => setField('confirmPassword', e.target.value)}
                onBlur={() => validateField(rules, 'confirmPassword')}
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
                    <HugeiconsIcon icon={UserAdd01Icon} className="size-4" />
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
