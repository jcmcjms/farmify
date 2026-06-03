import { Router } from 'express';
import { deliveryController } from '../controllers/deliveryController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All delivery routes require authentication
router.use(authenticate);

// GET /api/deliveries — List deliveries
router.get('/', deliveryController.list);

// GET /api/deliveries/:id — Get delivery by ID
router.get('/:id', deliveryController.getById);

// POST /api/deliveries/:id/accept — Driver accepts a delivery
router.post('/:id/accept', deliveryController.acceptDelivery);

// PATCH /api/deliveries/:id/status — Update delivery status
router.patch('/:id/status', deliveryController.updateStatus);

export default router;

// Route for getting delivery by order — mounted at /api/orders/:orderId/delivery in server.ts
