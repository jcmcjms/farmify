import { Router } from 'express';
import { jobController } from '../controllers/jobController.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// ──────────────────────────────────────────────
// IMPORTANT: Static routes must be defined
// BEFORE parameterized routes (`/:id`).
// ──────────────────────────────────────────────

// PUT /api/jobs/applications/:id/status - Update application status (farmer only)
router.put('/applications/:id/status', authenticate, requireRole('farmer', 'admin'), jobController.updateApplicationStatus);

// GET /api/jobs - List jobs with filters and pagination
router.get('/', optionalAuth, jobController.list);

// GET /api/jobs/:id - Get a single job with applications count
router.get('/:id', optionalAuth, jobController.getById);

// POST /api/jobs - Create a job (farmer only)
router.post('/', authenticate, requireRole('farmer', 'admin'), jobController.create);

// PUT /api/jobs/:id - Update a job (owner farmer only)
router.put('/:id', authenticate, requireRole('farmer', 'admin'), jobController.update);

// DELETE /api/jobs/:id - Delete a job (owner farmer only)
router.delete('/:id', authenticate, requireRole('farmer', 'admin'), jobController.remove);

// POST /api/jobs/:id/apply - Apply for a job
router.post('/:id/apply', authenticate, jobController.apply);

// GET /api/jobs/:id/applications - List applications for a job (owner farmer only)
router.get('/:id/applications', authenticate, requireRole('farmer', 'admin'), jobController.listApplications);

export default router;
