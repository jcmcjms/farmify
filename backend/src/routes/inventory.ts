import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// ──────────────────────────────────────────────
// IMPORTANT: Static routes must be defined
// BEFORE parameterized routes (`/:id`).
// ──────────────────────────────────────────────

// GET /api/inventory/alerts/low-stock - Get low stock alerts
router.get('/alerts/low-stock', authenticate, requireRole('farmer', 'admin'), inventoryController.lowStock);

// GET /api/inventory - List inventory items
router.get('/', authenticate, requireRole('farmer', 'admin'), inventoryController.list);

// GET /api/inventory/:id - Get a single item with transactions
router.get('/:id', authenticate, requireRole('farmer', 'admin'), inventoryController.getById);

// POST /api/inventory - Create a new inventory item
router.post('/', authenticate, requireRole('farmer', 'admin'), inventoryController.create);

// PUT /api/inventory/:id - Update an inventory item
router.put('/:id', authenticate, requireRole('farmer', 'admin'), inventoryController.update);

// DELETE /api/inventory/:id - Delete an inventory item
router.delete('/:id', authenticate, requireRole('farmer', 'admin'), inventoryController.remove);

// POST /api/inventory/:id/transaction - Add a transaction
router.post('/:id/transaction', authenticate, requireRole('farmer', 'admin'), inventoryController.addTransaction);

// GET /api/inventory/:id/transactions - List transactions for an item
router.get('/:id/transactions', authenticate, requireRole('farmer', 'admin'), inventoryController.listTransactions);

export default router;
