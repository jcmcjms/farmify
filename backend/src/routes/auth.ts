import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register - Create a new account
router.post('/register', authController.register);

// POST /api/auth/login - Log in to an existing account
router.post('/login', authController.login);

// GET /api/auth/me - Get current user profile (protected)
router.get('/me', authenticate, authController.getMe);

// PUT /api/auth/profile - Update current user profile (protected)
router.put('/profile', authenticate, authController.updateProfile);

export default router;
