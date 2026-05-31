import { Router } from 'express';
import { productController } from '../controllers/productController.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/products - List products with filters and pagination
router.get('/', optionalAuth, productController.list);

// GET /api/products/:id - Get a single product by ID
router.get('/:id', optionalAuth, productController.getById);

// POST /api/products - Create a product (farmer only)
router.post('/', authenticate, requireRole('farmer', 'admin'), productController.create);

// PUT /api/products/:id - Update a product (owner farmer only)
router.put('/:id', authenticate, requireRole('farmer', 'admin'), productController.update);

// DELETE /api/products/:id - Delete a product (owner farmer only)
router.delete('/:id', authenticate, requireRole('farmer', 'admin'), productController.remove);

export default router;
