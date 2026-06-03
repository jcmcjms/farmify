import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from '@/hooks/useForm'
import { driversApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { HugeiconsIcon } from '@hugeicons/react'
import { DeliveryTruck01Icon, NaturalFoodIcon } from '@hugeicons/core-free-icons'
import type { DriverProfile } from '@/types'

const vehicleOptions = [
  { value: 'bike', label: 'Bicycle' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'car', label: 'Car' },
  { value: 'truck', label: 'Truck' },
  { value: 'van', label: 'Van' },
]

/**
 * DriverRegister page — registration form for delivery riders.
 */
export default function DriverRegister() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const { form, errors, setField, validate, validateField } = useForm({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    vehicleType: 'motorcycle' as string,
    vehiclePlate: '',
    serviceArea: '',
    serviceRadius: '10',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const rules = {
    name: (v: string) => !v?.trim() ? 'Name is required' : undefined,
    email: (v: string) => !v?.trim() ? 'Email is required' : !/\S+@\S+\.\S+/.test(v) ? 'Invalid email format' : undefined,
    password: (v: string) => !v ? 'Password is required' : v.length < 6 ? 'Password must be at least 6 characters' : undefined,
    confirmPassword: (v: string, f: Record<string, unknown>) =>
      !f.confirmPassword ? 'Please confirm your password' : f.password !== f.confirmPassword ? 'Passwords do not match' : undefined,
    phone: (v: string) => v && !/^[\d\s\-+()]{7,}$/.test(v) ? 'Invalid phone number' : undefined,
    vehiclePlate: (v: string) => !v?.trim() ? 'Vehicle plate is required' : undefined,
    serviceArea: (v: string) => !v?.trim() ? 'Service area is required' : undefined,
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validate(rules)) return

    setLoading(true)
    try {
      // Register as 'driver' — the backend now supports this as a first-class role
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'driver',
        phone: form.phone || undefined,
      })

      // Save driver profile with vehicle info
      try {
        await driversApi.updateProfile({
          vehicle_type: form.vehicleType as DriverProfile['vehicle_type'],
          vehicle_plate: form.vehiclePlate,
          service_area: form.serviceArea,
          service_radius_km: Number(form.serviceRadius),
        })
      } catch {
        // Profile save is best-effort; user can complete it later from their dashboard
      }

      setRegistered(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center animate-fade-in">
        <HugeiconsIcon icon={DeliveryTruck01Icon} className="size-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold font-display">Registration Submitted!</h1>
        <p className="text-muted-foreground mt-2">
          Your delivery rider account is pending verification. You'll be able to start
          accepting deliveries once an admin approves your account.
        </p>
        <Button className="mt-6" onClick={() => navigate('/deliveries/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    )
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
            <CardTitle className="font-display">Become a Delivery Rider</CardTitle>
            <CardDescription>
              Deliver farm-fresh products and earn on your schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="rider@example.com"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                error={errors.email}
                autoComplete="email"
              />

              <Input
                label="Phone"
                type="tel"
                placeholder="+63 912 345 6789"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                error={errors.phone}
                autoComplete="tel"
              />

              <Select
                label="Vehicle Type"
                value={form.vehicleType}
                onChange={(e) => setField('vehicleType', e.target.value)}
                options={vehicleOptions}
              />

              <Input
                label="Vehicle Plate Number"
                placeholder="ABC 1234"
                value={form.vehiclePlate}
                onChange={(e) => setField('vehiclePlate', e.target.value)}
                error={errors.vehiclePlate}
              />

              <Input
                label="Service Area"
                placeholder="e.g. Manila, Quezon City"
                value={form.serviceArea}
                onChange={(e) => setField('serviceArea', e.target.value)}
                error={errors.serviceArea}
              />

              <Select
                label="Service Radius (km)"
                value={form.serviceRadius}
                onChange={(e) => setField('serviceRadius', e.target.value)}
                options={[
                  { value: '5', label: '5 km' },
                  { value: '10', label: '10 km' },
                  { value: '15', label: '15 km' },
                  { value: '20', label: '20 km' },
                  { value: '30', label: '30 km' },
                  { value: '50', label: '50 km' },
                ]}
              />

              <Input
                label="Password"
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                onBlur={() => validateField(rules, 'password')}
                error={errors.password}
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => setField('confirmPassword', e.target.value)}
                onBlur={() => validateField(rules, 'confirmPassword')}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Submitting...' : 'Register as Rider'}
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
