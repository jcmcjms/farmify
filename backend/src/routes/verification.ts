import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { verificationController } from '../controllers/verificationController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// ── Multer setup for verification document uploads ─────────────────────

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/verifications');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ── Multer error handling wrapper ──────────────────────────────────────

function handleMulterError(err: any, _req: any, res: any, next: any): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: 'File too large. Maximum file size is 5MB.',
      });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        error: `Unexpected file field: ${err.field}. Allowed fields: government_id, barangay_certificate, farm_photos, selfie_with_id.`,
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }
  if (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }
  next();
}

// ── Farmer Verification Routes ─────────────────────────────────────────

// GET /api/auth/verification — Get my verification status
router.get('/verification', authenticate, requireRole('farmer'), verificationController.getMyVerification);

// POST /api/auth/verification — Submit initial verification
router.post(
  '/verification',
  authenticate,
  requireRole('farmer'),
  (req, res, next) => {
    upload.fields([
      { name: 'government_id', maxCount: 1 },
      { name: 'barangay_certificate', maxCount: 1 },
      { name: 'farm_photos', maxCount: 3 },
      { name: 'selfie_with_id', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  verificationController.submitVerification
);

// PUT /api/auth/verification — Resubmit verification (when rejected)
router.put(
  '/verification',
  authenticate,
  requireRole('farmer'),
  (req, res, next) => {
    upload.fields([
      { name: 'government_id', maxCount: 1 },
      { name: 'barangay_certificate', maxCount: 1 },
      { name: 'farm_photos', maxCount: 3 },
      { name: 'selfie_with_id', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  verificationController.resubmitVerification
);

export default router;
