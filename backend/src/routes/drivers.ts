import { Router } from 'express';
import { driverController } from '../controllers/driverController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All driver routes require authentication
router.use(authenticate);

// GET /api/drivers/profile — Get current driver profile
router.get('/profile', driverController.getProfile);

// PATCH /api/drivers/profile — Update driver profile
router.patch('/profile', driverController.updateProfile);

// PATCH /api/drivers/availability — Toggle availability
router.patch('/availability', driverController.toggleAvailability);

// GET /api/drivers/deliveries — List driver's deliveries
router.get('/deliveries', driverController.getDeliveries);

export default router;
