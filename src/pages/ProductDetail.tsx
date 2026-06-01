import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageSpinner } from '@/components/ui/spinner'
import { DetailPageSkeleton } from '@/components/ui/skeleton'
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { productsApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Product } from '@/types'
import { Leaf, ShoppingCart, Minus, Plus, ArrowLeft, Package, LogIn } from 'lucide-react'

/**
 * Product detail — full view of a single product.
 */
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchProduct = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await productsApi.getById(Number(id))
        if (res.data) {
          setProduct(res.data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  if (loading) return <DetailPageSkeleton />

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <Package className="size-16 text-muted-foreground/30" />
          <h2 className="text-xl font-semibold">Product Not Found</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="size-4" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    )
  }

  if (!product) return null

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Marketplace', href: '/marketplace' },
    { label: product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : 'Product', href: `/marketplace?category=${product.category}` },
    { label: product.name },
  ]

  const isAvailable = product.is_available && product.quantity > 0

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=products/' + id)
      return
    }
    setAdding(true)
    try {
      await addToCart(product, quantity)
      navigate('/cart')
    } catch {
      // handled
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbs} />

      {/* Auth hint for unauthenticated users */}
      {!isAuthenticated && (
        <div className="mb-6 flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
          <LogIn className="size-4 shrink-0" />
          <span>
            <strong>Sign in</strong> to add this product to your cart.{' '}
            <button
              onClick={() => navigate('/login?redirect=products/' + id)}
              className="underline font-medium hover:text-blue-900"
            >
              Login here
            </button>
          </span>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-xl bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Leaf className="size-24 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {product.is_organic && (
              <Badge variant="success" className="gap-1">
                <Leaf className="size-3" />
                Organic Certified
              </Badge>
            )}
            <Badge variant="secondary" className="capitalize">
              {product.category}
            </Badge>
            {!isAvailable && (
              <Badge variant="danger">Unavailable</Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold text-foreground font-display">{product.name}</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            by {product.farmer_name || `Farmer #${product.farmer_id}`}
          </p>

          <div className="mt-6">
            <span className="text-4xl font-bold text-primary">
              {formatCurrency(product.price)}
            </span>
            <span className="text-lg text-muted-foreground ml-2">/{product.unit}</span>
          </div>

          <Separator className="my-6" />

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {product.description || 'No description provided.'}
            </p>
          </div>

          <Separator className="my-6" />

          {/* Product info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Available Quantity</span>
              <p className={`font-semibold ${product.quantity <= 10 ? 'text-destructive' : ''}`}>
                {product.quantity} {product.unit}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Listed On</span>
              <p className="font-semibold">{formatDate(product.created_at)}</p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Add to cart section */}
          {isAvailable ? (
            <div className="space-y-4">
              {/* Quantity selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                    disabled={quantity >= product.quantity}
                  >
                    <Plus className="size-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground ml-2">
                    {product.quantity} {product.unit} available
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                disabled={adding}
                onClick={handleAddToCart}
              >
                {adding ? (
                  'Adding...'
                ) : (
                  <>
                    <ShoppingCart className="size-5" />
                    Add to Cart — {formatCurrency(product.price * quantity)}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-muted-foreground font-medium">This product is currently unavailable.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
