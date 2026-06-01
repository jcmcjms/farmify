import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { PageSpinner } from '@/components/ui/spinner'
import { cartApi, ordersApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/context/CartContext'
import type { CartItem } from '@/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, CheckmarkCircle01Icon, ShoppingBag01Icon } from '@hugeicons/core-free-icons'

/**
 * Checkout page — order summary and shipping details.
 */
export default function Checkout() {
  const navigate = useNavigate()
  const { refreshCart } = useCart()

  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState<number | null>(null)

  const [shippingAddress, setShippingAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [validation, setValidation] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await cartApi.getCart()
        if (res.data) {
          setItems(res.data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cart')
      } finally {
        setLoading(false)
      }
    }
    fetchCart()
  }, [])

  const subtotal = items.reduce((sum, item) => {
    return sum + (item.product?.price ?? 0) * item.quantity
  }, 0)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!shippingAddress.trim()) errs.shippingAddress = 'Shipping address is required'
    setValidation(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validate()) return
    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }

    setSubmitting(true)
    try {
      const res = await ordersApi.create({
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        shipping_address: shippingAddress,
        notes: notes || undefined,
      })

      if (res.data) {
        setOrderId(res.data.id)
        setSuccess(true)
        await refreshCart()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageSpinner text="Loading checkout..." />

  // Success state
  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center animate-fade-in">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 mb-6">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Order Placed Successfully!</h1>
        <p className="text-muted-foreground mb-2">
          Your order #{orderId} has been placed and is being processed.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          You will receive a confirmation and updates on your order status.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => navigate('/orders')}>
            View Orders
          </Button>
          <Button variant="outline" onClick={() => navigate('/marketplace')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <button
        onClick={() => navigate('/cart')}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
        Back to Cart
      </button>

      <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Shipping Details */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shipping Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Shipping Address"
                  placeholder="Enter your complete shipping address"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  error={validation.shippingAddress}
                />
                <Textarea
                  label="Order Notes (optional)"
                  placeholder="Any special instructions for the farmer?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items list */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {item.product?.name || `Product #${item.product_id}`}
                        </p>
                        <p className="text-muted-foreground">
                          Qty: {item.quantity} × {formatCurrency(item.product?.price ?? 0)}
                        </p>
                      </div>
                      <p className="font-medium ml-4">
                        {formatCurrency((item.product?.price ?? 0) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">To be arranged</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">{formatCurrency(subtotal)}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitting || items.length === 0}
                >
                  {submitting ? (
                    'Placing Order...'
                  ) : (
                    <>
                      <HugeiconsIcon icon={ShoppingBag01Icon} className="size-4" />
                      Place Order
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
