import { createContext, useState, useCallback, useContext, type ReactNode } from 'react'
import { cartApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type { Product } from '@/types'

/**
 * Cart context shape.
 */
interface CartContextType {
  itemCount: number
  addToCart: (product: Product, quantity?: number) => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

/**
 * Cart provider — manages cart item count for badge display.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [itemCount, setItemCount] = useState(0)

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItemCount(0)
      return
    }
    try {
      const res = await cartApi.getCart()
      if (res.data) {
        setItemCount(res.data.reduce((sum, item) => sum + item.quantity, 0))
      }
    } catch {
      // Silently fail
    }
  }, [isAuthenticated])

  const addToCart = useCallback(async (product: Product, quantity = 1) => {
    try {
      await cartApi.addItem({ product_id: product.id, quantity })
      await refreshCart()
    } catch {
      throw new Error('Failed to add item to cart')
    }
  }, [refreshCart])

  return (
    <CartContext.Provider value={{ itemCount, addToCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  )
}

/**
 * Hook to access cart context.
 */
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
