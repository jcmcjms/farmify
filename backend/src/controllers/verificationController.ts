import { Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';

// ── Validation Schemas ─────────────────────────────────────────────────

const submitVerificationSchema = z.object({
  farm_name: z.string().min(2, 'Farm name must be at least 2 characters'),
  farm_address: z.string().min(5, 'Farm address must be at least 5 characters'),
  farm_city: z.string().min(2, 'Farm city must be at least 2 characters'),
  farm_province: z.string().min(2, 'Farm province must be at least 2 characters'),
  farm_size_hectares: z.coerce.number().positive('Farm size must be a positive number'),
  years_farming: z.coerce.number().int().positive('Years farming must be a positive integer'),
  crops_grown: z.string().min(2, 'Crops grown must be at least 2 characters'),
  government_id_type: z.string().min(1, 'Government ID type is required'),
  cooperative_name: z.string().optional().nullable(),
});

// ── Allowed document types ─────────────────────────────────────────────

const DOCUMENT_TYPES = [
  'government_id',
  'barangay_certificate',
  'farm_photos',
  'selfie_with_id',
] as const;

// ── Controller Methods ─────────────────────────────────────────────────

export const verificationController = {
  /**
   * GET /api/auth/verification
   * Get the authenticated farmer's verification status, profile, and documents.
   */
  async getMyVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      // Get verification status from users table
      const userResult = await pool.query(
        'SELECT verification_status FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found.',
        });
        return;
      }

      const status = userResult.rows[0].verification_status;

      // Get farmer profile
      const profileResult = await pool.query(
        'SELECT * FROM farmer_profiles WHERE farmer_id = $1',
        [userId]
      );

      // Get verification documents
      const docsResult = await pool.query(
        'SELECT id, document_type, file_path, file_name, mime_type, file_size, created_at FROM verification_documents WHERE farmer_id = $1',
        [userId]
      );

      res.status(200).json({
        success: true,
        data: {
          status,
          profile: profileResult.rows.length > 0 ? profileResult.rows[0] : null,
          documents: docsResult.rows,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/verification
   * Submit farmer verification for the first time or resubmit.
   * Files are handled by multer middleware; this method processes them.
   */
  async submitVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      // Check current verification status — must be unverified or rejected
      const userResult = await pool.query(
        'SELECT verification_status FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found.',
        });
        return;
      }

      const currentStatus = userResult.rows[0].verification_status;

      if (currentStatus !== 'unverified' && currentStatus !== 'rejected') {
        res.status(400).json({
          success: false,
          error: `Cannot submit verification. Current status is "${currentStatus}". Only "unverified" or "rejected" farmers can submit.`,
        });
        return;
      }

      // Validate body fields
      const data = submitVerificationSchema.parse(req.body);

      // Validate files — at least 1 farm_photo required
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      if (!files || !files.farm_photos || files.farm_photos.length === 0) {
        res.status(400).json({
          success: false,
          error: 'At least one farm photo is required.',
        });
        return;
      }

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Check if a farmer profile already exists (resubmit scenario)
        const existingProfile = await client.query(
          'SELECT id FROM farmer_profiles WHERE farmer_id = $1',
          [userId]
        );

        if (existingProfile.rows.length > 0) {
          // UPDATE existing profile
          await client.query(
            `UPDATE farmer_profiles
             SET farm_name = $1, farm_address = $2, farm_city = $3, farm_province = $4,
                 farm_size_hectares = $5, years_farming = $6, crops_grown = $7,
                 government_id_type = $8, cooperative_name = $9,
                 submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE farmer_id = $10`,
            [
              data.farm_name,
              data.farm_address,
              data.farm_city,
              data.farm_province,
              data.farm_size_hectares,
              data.years_farming,
              data.crops_grown,
              data.government_id_type,
              data.cooperative_name || null,
              userId,
            ]
          );
        } else {
          // INSERT new profile
          await client.query(
            `INSERT INTO farmer_profiles
             (farmer_id, farm_name, farm_address, farm_city, farm_province,
              farm_size_hectares, years_farming, crops_grown,
              government_id_type, cooperative_name, submitted_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)`,
            [
              userId,
              data.farm_name,
              data.farm_address,
              data.farm_city,
              data.farm_province,
              data.farm_size_hectares,
              data.years_farming,
              data.crops_grown,
              data.government_id_type,
              data.cooperative_name || null,
            ]
          );
        }

        // Delete old verification documents for this farmer
        await client.query(
          'DELETE FROM verification_documents WHERE farmer_id = $1',
          [userId]
        );

        // Insert new documents from uploaded files
        for (const docType of DOCUMENT_TYPES) {
          const uploadedFiles = files[docType];
          if (uploadedFiles && uploadedFiles.length > 0) {
            for (const file of uploadedFiles) {
              await client.query(
                `INSERT INTO verification_documents
                 (farmer_id, document_type, file_path, file_name, mime_type, file_size)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                  userId,
                  docType,
                  file.path.replace(/\\/g, '/'), // normalize to forward slashes
                  file.originalname,
                  file.mimetype,
                  file.size,
                ]
              );
            }
          }
        }

        // Set verification_status to pending
        await client.query(
          'UPDATE users SET verification_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['pending', userId]
        );

        await client.query('COMMIT');

        // Fetch the updated profile and documents to return
        const profileResult = await pool.query(
          'SELECT * FROM farmer_profiles WHERE farmer_id = $1',
          [userId]
        );

        const docsResult = await pool.query(
          'SELECT id, document_type, file_path, file_name, mime_type, file_size, created_at FROM verification_documents WHERE farmer_id = $1',
          [userId]
        );

        res.status(200).json({
          success: true,
          data: {
            status: 'pending',
            profile: profileResult.rows[0] || null,
            documents: docsResult.rows,
          },
          message: 'Verification submitted successfully. Your documents are now pending review.',
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      // If it's a multer error (file too large, wrong type), handle it
      if (error instanceof Error && error.message.includes('Only JPEG')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  },

  /**
   * PUT /api/auth/verification
   * Resubmit verification — allowed only when status is "rejected".
   * Delegates to the same logic as submitVerification.
   */
  async resubmitVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      // Check that current status is "rejected"
      const userResult = await pool.query(
        'SELECT verification_status FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found.',
        });
        return;
      }

      const currentStatus = userResult.rows[0].verification_status;

      if (currentStatus !== 'rejected') {
        res.status(400).json({
          success: false,
          error: `Resubmission is only allowed when your verification is "rejected". Current status: "${currentStatus}".`,
        });
        return;
      }

      // Delegate to submitVerification logic
      // We call the same handler by forwarding req, res, next
      return verificationController.submitVerification(req, res, next);
    } catch (error) {
      next(error);
    }
  },
};
