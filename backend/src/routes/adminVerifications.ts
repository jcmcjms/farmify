import { Router } from 'express';
import { adminVerificationController } from '../controllers/adminVerificationController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// All routes require authentication + admin role
router.use(authenticate, requireRole('admin'));

// ── Verification Management Routes ─────────────────────────────────────

router.get('/verifications', adminVerificationController.listVerifications);
router.get('/verifications/:id', adminVerificationController.getVerificationDetail);
router.put('/verifications/:id/approve', adminVerificationController.approveVerification);
router.put('/verifications/:id/reject', adminVerificationController.rejectVerification);

export default router;
