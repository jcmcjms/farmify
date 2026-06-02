import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { deliveriesApi, driversApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader, EmptyState, ErrorBanner } from '@/components/shared'
import { PageSpinner } from '@/components/ui/spinner'
import { formatDate } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DeliveryTruck01Icon,
  Road01Icon,
  CheckmarkCircle01Icon,
  TimeQuarterIcon,
  StarIcon,
} from '@hugeicons/core-free-icons'
import type { Delivery } from '@/types'

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
  assigned: 'Assigned to You',
  accepted: 'Accepted',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

/**
 * DriverDashboard — main hub for delivery riders.
 * Shows availability toggle, active delivery, available requests, and history.
 */
export default function DriverDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [available, setAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDeliveries = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await driversApi.getDeliveries({ limit: '20' })
      if (res.data) {
        setDeliveries(res.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeliveries()
  }, [fetchDeliveries])

  const handleToggleAvailability = async () => {
    const newState = !available
    setAvailable(newState)
    try {
      await driversApi.toggleAvailability(newState)
    } catch {
      setAvailable(!newState)
    }
  }

  const handleAccept = async (deliveryId: number) => {
    try {
      const res = await deliveriesApi.acceptDelivery(deliveryId)
      if (res.data) {
        setDeliveries((prev) =>
          prev.map((d) => (d.id === deliveryId ? res.data! : d))
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept delivery')
    }
  }

  const activeDelivery = deliveries.find(
    (d) => !['delivered', 'failed', 'cancelled'].includes(d.status)
  )
  const pendingRequests = deliveries.filter((d) => d.status === 'assigned')
  const completedDeliveries = deliveries.filter((d) => d.status === 'delivered')

  if (loading) return <PageSpinner text="Loading dashboard..." />

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <PageHeader
        title="Rider Dashboard"
        description={`Welcome, ${user?.name || 'Rider'}`}
      />

      {error && <ErrorBanner message={error} onRetry={fetchDeliveries} />}

      {/* Availability Toggle */}
      <Card className="mb-6">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div
              className={`size-3 rounded-full ${available ? 'bg-green-500' : 'bg-gray-400'}`}
              aria-hidden="true"
            />
            <div>
              <p className="font-medium">You are {available ? 'Online' : 'Offline'}</p>
              <p className="text-sm text-muted-foreground">
                {available
                  ? 'Available to accept delivery requests'
                  : 'Not accepting new deliveries'}
              </p>
            </div>
          </div>
          <Button
            variant={available ? 'destructive' : 'default'}
            size="sm"
            onClick={handleToggleAvailability}
            aria-label={available ? 'Go offline' : 'Go online'}
          >
            {available ? 'Go Offline' : 'Go Online'}
          </Button>
        </CardContent>
      </Card>

      {/* Active Delivery */}
      {activeDelivery && (
        <Card className="mb-6 border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Road01Icon className="size-5 text-primary" />
              Active Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-semibold">Delivery #{activeDelivery.id}</p>
                <p className="text-sm text-muted-foreground">
                  Status:{' '}
                  <Badge className={statusColors[activeDelivery.status]}>
                    {statusLabels[activeDelivery.status]}
                  </Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  Assigned: {formatDate(activeDelivery.assigned_at || activeDelivery.created_at)}
                </p>
              </div>
              <Button onClick={() => navigate(`/deliveries/${activeDelivery.id}`)}>
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
            <TimeQuarterIcon className="size-5 text-yellow-500" />
            Available Requests ({pendingRequests.length})
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((delivery) => (
              <Card key={delivery.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">Delivery #{delivery.id}</p>
                      <p className="text-sm text-muted-foreground">
                        Order #{delivery.order_id}
                      </p>
                      {delivery.pickup_notes && (
                        <p className="text-sm text-muted-foreground">
                          Notes: {delivery.pickup_notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created: {formatDate(delivery.created_at)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAccept(delivery.id)}
                      className="shrink-0"
                    >
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
                      Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-primary">{activeDelivery ? 1 : 0}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{completedDeliveries.length}</p>
            <p className="text-sm text-muted-foreground">Completed Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold">
              <HugeiconsIcon icon={StarIcon} className="size-5 text-yellow-500" />
              <span>—</span>
            </div>
            <p className="text-sm text-muted-foreground">Rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Completed Deliveries */}
      {completedDeliveries.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Recent Deliveries</h2>
          <div className="space-y-2">
            {completedDeliveries.slice(0, 5).map((delivery) => (
              <Card key={delivery.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">Delivery #{delivery.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {delivery.delivered_at
                        ? formatDate(delivery.delivered_at)
                        : 'Completed'}
                    </p>
                  </div>
                  <Badge className={statusColors[delivery.status]}>
                    {statusLabels[delivery.status]}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!activeDelivery && pendingRequests.length === 0 && completedDeliveries.length === 0 && (
        <EmptyState
          icon={DeliveryTruck01Icon}
          title="No deliveries yet"
          description="New delivery requests will appear here when farmers mark orders as ready for pickup."
        />
      )}
    </div>
  )
}
