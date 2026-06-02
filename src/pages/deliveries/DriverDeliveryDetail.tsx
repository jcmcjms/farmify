import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { deliveriesApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageSpinner } from '@/components/ui/spinner'
import { ErrorBanner } from '@/components/shared'
import { formatDate } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  PackageIcon,
  Road01Icon,
  DeliveryTruck01Icon,
} from '@hugeicons/core-free-icons'
import type { Delivery } from '@/types'

const statusSteps = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
] as const

const statusColors: Record<string, string> = {
  waiting_assignment: 'bg-muted text-muted-foreground',
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  accepted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  picked_up: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  in_transit: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
}

const statusLabels: Record<string, string> = {
  waiting_assignment: 'Waiting',
  assigned: 'Assigned',
  accepted: 'Accepted',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

const nextStatus: Record<string, { status: string; label: string; icon: typeof CheckmarkCircle01Icon } | null> = {
  assigned: { status: 'accepted', label: 'Accept Delivery', icon: CheckmarkCircle01Icon },
  accepted: { status: 'picked_up', label: 'Mark as Picked Up', icon: PackageIcon },
  picked_up: { status: 'in_transit', label: 'Mark as In Transit', icon: Road01Icon },
  in_transit: { status: 'delivered', label: 'Mark as Delivered', icon: DeliveryTruck01Icon },
}

/**
 * DriverDeliveryDetail — view and manage a single delivery.
 */
export default function DriverDeliveryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchDelivery = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await deliveriesApi.getById(Number(id))
        if (res.data) {
          setDelivery(res.data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load delivery')
      } finally {
        setLoading(false)
      }
    }

    fetchDelivery()
  }, [id])

  const handleAction = async (newStatus: string) => {
    if (!delivery) return
    setUpdating(true)
    setError('')
    try {
      const res = await deliveriesApi.updateStatus(delivery.id, newStatus)
      if (res.data) {
        setDelivery(res.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update delivery')
    } finally {
      setUpdating(false)
    }
  }

  const handleDecline = async () => {
    if (!delivery) return
    setUpdating(true)
    setError('')
    try {
      await deliveriesApi.updateStatus(delivery.id, 'cancelled', 'Declined by driver')
      navigate('/deliveries/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline delivery')
    } finally {
      setUpdating(false)
    }
  }

  const currentStepIndex = delivery
    ? statusSteps.findIndex((s) => s.key === delivery.status)
    : -1

  if (loading) return <PageSpinner text="Loading delivery..." />

  if (error && !delivery) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <HugeiconsIcon icon={PackageIcon} className="size-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Delivery Not Found</h2>
        <p className="text-muted-foreground mt-1">{error}</p>
        <Button className="mt-4" onClick={() => navigate('/deliveries/dashboard')}>
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  if (!delivery) return null

  const nextAction = nextStatus[delivery.status]
  const isDelivered = delivery.status === 'delivered'
  const isFailed = delivery.status === 'failed' || delivery.status === 'cancelled'
  const isAssigned = delivery.status === 'assigned'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <button
        onClick={() => navigate('/deliveries/dashboard')}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
        Back to Dashboard
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Delivery #{delivery.id}</h1>
          <p className="text-muted-foreground mt-1">
            Order #{delivery.order_id} — Created {formatDate(delivery.created_at)}
          </p>
        </div>
        <Badge className={`text-sm px-3 py-1 ${statusColors[delivery.status]}`}>
          {statusLabels[delivery.status]}
        </Badge>
      </div>

      {error && (
        <ErrorBanner message={error} onRetry={() => setError('')} />
      )}

      {/* Delivery Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Delivery Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, i) => {
              const isCompleted = i <= currentStepIndex
              const isCurrent = i === currentStepIndex && !isDelivered && !isFailed
              return (
                <div key={step.key} className="flex flex-col items-center gap-1">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center text-xs font-bold
                      ${isCompleted && !isFailed
                        ? 'bg-primary text-primary-foreground'
                        : isFailed && i === currentStepIndex
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-muted text-muted-foreground'
                      }
                      ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}
                    `}
                  >
                    {isCompleted && !isFailed ? '✓' : i + 1}
                  </div>
                  <span
                    className={`text-xs ${isCompleted ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid gap-6 mb-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pickup</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{delivery.pickup_notes || 'Farmer location'}</p>
            {delivery.picked_up_at && (
              <p className="text-muted-foreground">
                Picked up: {formatDate(delivery.picked_up_at)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dropoff</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{delivery.delivery_notes || 'Buyer location'}</p>
            {delivery.delivered_at && (
              <p className="text-muted-foreground">
                Delivered: {formatDate(delivery.delivered_at)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Area */}
      {!isDelivered && !isFailed && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {nextAction && (
                <Button
                  onClick={() => handleAction(nextAction.status)}
                  disabled={updating}
                >
                  <HugeiconsIcon icon={nextAction.icon} className="size-4" />
                  {updating ? 'Updating...' : nextAction.label}
                </Button>
              )}

              {isAssigned && (
                <Button
                  variant="destructive"
                  onClick={handleDecline}
                  disabled={updating}
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                  Decline
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed */}
      {isDelivered && (
        <Card>
          <CardContent className="py-8 text-center">
            <HugeiconsIcon icon={DeliveryTruck01Icon} className="size-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">Delivery Complete</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This delivery has been completed successfully.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
