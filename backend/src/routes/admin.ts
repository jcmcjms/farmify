import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireRole('admin'));

// ── User Management ────────────────────────────────────────────────────

router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUser);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/reset-password', adminController.resetPassword);

// ── Roles & Stats ──────────────────────────────────────────────────────

router.get('/roles', adminController.listRoles);
router.get('/stats', adminController.getStats);

export default router;
