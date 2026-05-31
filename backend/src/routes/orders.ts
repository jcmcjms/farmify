import { Router } from 'express';
import { orderController } from '../controllers/orderController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// ──────────────────────────────────────────────
// IMPORTANT: Static routes MUST be defined
// BEFORE parameterized routes (`/:id`) to
// prevent "buyer" from being matched as an id.
// ──────────────────────────────────────────────

// GET /api/orders/buyer/orders - Get orders for current buyer
router.get('/buyer/orders', authenticate, requireRole('buyer'), orderController.listBuyerOrders);

// GET /api/orders - List user's orders (buyer sees own, farmer sees orders with their products)
router.get('/', authenticate, orderController.list);

// GET /api/orders/:id - Get order details with items
router.get('/:id', authenticate, orderController.getById);

// POST /api/orders - Create order from cart items (buyer only)
router.post('/', authenticate, requireRole('buyer'), orderController.create);

// PUT /api/orders/:id/status - Update order status (farmer/admin only)
router.put('/:id/status', authenticate, requireRole('farmer', 'admin'), orderController.updateStatus);

export default router;
