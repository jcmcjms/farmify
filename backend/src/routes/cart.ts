import { Router } from 'express';
import { cartController } from '../controllers/cartController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// All cart routes require authentication and buyer role
router.use(authenticate, requireRole('buyer'));

// GET /api/cart - Get user's cart items with product details
router.get('/', cartController.list);

// POST /api/cart - Add item to cart (or update quantity if exists)
router.post('/', cartController.addItem);

// PUT /api/cart/:id - Update cart item quantity
router.put('/:id', cartController.updateItem);

// DELETE /api/cart - Clear entire cart (must be before /:id)
router.delete('/', cartController.clearCart);

// DELETE /api/cart/:id - Remove specific item from cart
router.delete('/:id', cartController.removeItem);

export default router;
