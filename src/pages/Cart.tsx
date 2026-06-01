import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageSpinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { ErrorBanner, EmptyState } from '@/components/shared'
import { cartApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/context/CartContext'
import type { CartItem } from '@/types'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, MinusSignIcon, PackageIcon, PlusSignIcon, ShoppingCart01Icon } from '@hugeicons/core-free-icons'

/**
 * Shopping cart page.
 */
export default function Cart() {
  const navigate = useNavigate()
  const { refreshCart } = useCart()

  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const fetchCart = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await cartApi.getCart()
      if (res.data && Array.isArray(res.data)) {
        setItems(res.data)
      } else if (res.data && !Array.isArray(res.data)) {
        // API returned unexpected format — show error instead of crashing
        setError('Could not load cart data. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const handleQuantityChange = async (item: CartItem, newQty: number) => {
    if (newQty < 1) return
    setUpdatingId(item.id)
    try {
      await cartApi.updateItem(item.id, { quantity: newQty })
      await fetchCart()
      await refreshCart()
    } catch {
      // handled
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemove = async (itemId: number) => {
    setUpdatingId(itemId)
    try {
      await cartApi.removeItem(itemId)
      await fetchCart()
      await refreshCart()
    } catch {
      // handled
    } finally {
      setUpdatingId(null)
    }
  }

  const cartItems = Array.isArray(items) ? items : []
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.product?.price ?? 0) * item.quantity
  }, 0)

  if (loading) return <PageSpinner text="Loading cart..." />

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <HugeiconsIcon icon={ShoppingCart01Icon} className="size-7" />
          Shopping Cart
        </h1>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchCart} />}

      {!loading && cartItems.length === 0 && (
        <EmptyState
          icon={Package}
          title="Your cart is empty"
          description="Browse the marketplace to add items to your cart."
          action={{ label: 'Browse Marketplace', onClick: () => navigate('/marketplace') }}
        />
      )}

      {cartItems.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className={updatingId === item.id ? 'opacity-60' : ''}>
                <CardContent className="flex items-center gap-4 p-4">
                  {/* Product image */}
                  <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.product?.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <HugeiconsIcon icon={PackageIcon} className="size-8 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product_id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.product?.name || `Product #${item.product_id}`}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {formatCurrency(item.product?.price ?? 0)} / {item.product?.unit}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                      disabled={item.quantity <= 1 || updatingId === item.id}
                    >
                      <HugeiconsIcon icon={MinusSignIcon} className="size-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      disabled={updatingId === item.id}
                    >
                      <HugeiconsIcon icon={PlusSignIcon} className="size-3" />
                    </Button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[80px]">
                    <p className="font-semibold">
                      {formatCurrency((item.product?.price ?? 0) * item.quantity)}
                    </p>
                  </div>

                  {/* Remove */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleRemove(item.id)}
                    disabled={updatingId === item.id}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Estimated Total</span>
                  <span className="font-bold text-lg">{formatCurrency(subtotal)}</span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </Button>
                <Link to="/marketplace">
                  <Button variant="outline" className="w-full" size="sm">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
