import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from '@/hooks/useForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { HugeiconsIcon } from '@hugeicons/react'
import { Login01Icon, NaturalFoodIcon } from '@hugeicons/core-free-icons'

/**
 * Login page with email/password form.
 */
export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const { form, errors, setField, validate, validateField } = useForm({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const rules = {
    email: (v: string) => !v ? 'Email is required' : !/\S+@\S+\.\S+/.test(v) ? 'Invalid email format' : undefined,
    password: (v: string) => !v ? 'Password is required' : v.length < 6 ? 'Password must be at least 6 characters' : undefined,
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validate(rules)) return

    setLoading(true)
    try {
      await login({ email: form.email, password: form.password })
      // Redirect based on role — admin goes to admin panel, others to dashboard
      const storedUser = localStorage.getItem('farmify_user')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        if (user.role === 'admin') {
          navigate('/admin')
          return
        }
        if (user.role === 'driver') {
          navigate('/deliveries/dashboard')
          return
        }
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
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
            <CardTitle className="font-display">Welcome Back</CardTitle>
            <CardDescription>Sign in to your Farmify account</CardDescription>
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
                label="Email"
                type="email"
                placeholder="farmer@example.com"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                onBlur={() => validateField(rules, 'email')}
                error={errors.email}
                autoComplete="email"
              />

              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                onBlur={() => validateField(rules, 'password')}
                error={errors.password}
                autoComplete="current-password"
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    <HugeiconsIcon icon={Login01Icon} className="size-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Create one here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
