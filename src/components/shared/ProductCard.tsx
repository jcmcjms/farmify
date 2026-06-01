import { Link, useNavigate } from 'react-router-dom'
import type { Product } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { ShoppingCart, Leaf, Eye } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

/**
 * Product card for marketplace grid display.
 */
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const navigate = useNavigate()
  const stockLow = product.quantity < 10

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Image */}
      <Link to={`/products/${product.id}`} className="block" aria-label={`View ${product.name}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-green-50 to-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="size-full object-cover transition-all duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center" aria-label={`${product.name} image placeholder`}>
              <Leaf className="size-12 text-primary/20 transition-transform duration-300 group-hover:scale-110" />
            </div>
          )}

          {/* Badges — semantic labels */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_organic && (
              <Badge variant="success" className="text-[10px]">
                <Leaf className="size-3 mr-0.5" />
                Organic
              </Badge>
            )}
            {stockLow && (
              <Badge variant="warning" className="text-[10px]">
                Low Stock
              </Badge>
            )}
          </div>
          {!product.is_available && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Badge variant="danger" className="text-xs">Unavailable</Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        {/* Farmer name */}
        <p className="text-xs text-muted-foreground mb-1">
          by {product.farmer_name || `Farmer #${product.farmer_id}`}
        </p>

        {/* Product name */}
        <Link
          to={`/products/${product.id}`}
          className="block font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
        >
          {product.name}
        </Link>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2" title={product.description}>
            {product.description}
          </p>
        )}

        {/* Price and unit */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(product.price)}
            </span>
            <span className="text-xs text-muted-foreground ml-1">/{product.unit}</span>
          </div>
          <span className={`text-xs font-medium ${stockLow ? 'text-destructive' : 'text-muted-foreground'}`}>
            {product.quantity} avail.
          </span>
        </div>

        {/* Action buttons */}
        {product.is_available && product.quantity > 0 && (
          <div className="mt-3 flex gap-2">
            {onAddToCart && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onAddToCart(product)}
              >
                <ShoppingCart className="size-4" />
                Add to Cart
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <Eye className="size-4" />
            </Button>
          </div>
        )}

        {/* Unavailable badge */}
        {(!product.is_available || product.quantity === 0) && (
          <Badge variant="danger" className="mt-3 w-full justify-center">
            Currently Unavailable
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
