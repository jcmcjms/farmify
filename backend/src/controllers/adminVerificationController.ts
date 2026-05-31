import { Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';

// ── Validation Schemas ─────────────────────────────────────────────────

const listVerificationsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(['unverified', 'pending', 'verified', 'rejected']).optional(),
});

const rejectSchema = z.object({
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
});

// ── Controller Methods ─────────────────────────────────────────────────

export const adminVerificationController = {
  /**
   * GET /api/admin/verifications
   * List all farmer verification requests with pagination and optional status filter.
   */
  async listVerifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, status } = listVerificationsSchema.parse(req.query);

      const conditions: string[] = ['u.role = $1'];
      const values: unknown[] = ['farmer'];
      let paramIndex = 2;

      if (status) {
        conditions.push(`u.verification_status = $${paramIndex++}`);
        values.push(status);
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      // Count total matching records
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM users u ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      // Fetch paginated results
      values.push(limit, offset);
      const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.verification_status, u.created_at,
                fp.farm_name, fp.farm_province, fp.submitted_at, fp.reviewed_at,
                fp.reviewed_by
         FROM users u
         LEFT JOIN farmer_profiles fp ON u.id = fp.farmer_id
         ${whereClause}
         ORDER BY fp.submitted_at DESC NULLS LAST, u.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        values
      );

      res.status(200).json({
        success: true,
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/verifications/:id
   * Get full verification detail for a specific farmer.
   */
  async getVerificationDetail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.phone, u.address, u.role,
                u.verification_status, u.created_at AS user_created_at,
                fp.*
         FROM users u
         LEFT JOIN farmer_profiles fp ON u.id = fp.farmer_id
         WHERE u.id = $1 AND u.role = 'farmer'`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Verification record not found.',
        });
        return;
      }

      // Get verification documents
      const docsResult = await pool.query(
        `SELECT id, document_type, file_path, file_name, mime_type, file_size, created_at
         FROM verification_documents
         WHERE farmer_id = $1
         ORDER BY created_at DESC`,
        [id]
      );

      res.status(200).json({
        success: true,
        data: {
          ...result.rows[0],
          documents: docsResult.rows,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/admin/verifications/:id/approve
   * Approve a farmer's verification.
   */
  async approveVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      // Verify the farmer exists
      const userResult = await pool.query(
        'SELECT id, verification_status FROM users WHERE id = $1 AND role = $2',
        [id, 'farmer']
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Farmer not found.',
        });
        return;
      }

      if (userResult.rows[0].verification_status !== 'pending') {
        res.status(400).json({
          success: false,
          error: `Cannot approve. Farmer's verification status is "${userResult.rows[0].verification_status}". Only "pending" verifications can be approved.`,
        });
        return;
      }

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Update user status
        await client.query(
          'UPDATE users SET verification_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['verified', id]
        );

        // Update farmer profile with review info
        await client.query(
          `UPDATE farmer_profiles
           SET reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1, updated_at = CURRENT_TIMESTAMP
           WHERE farmer_id = $2`,
          [adminId, id]
        );

        await client.query('COMMIT');

        res.status(200).json({
          success: true,
          data: {
            farmer_id: parseInt(String(id), 10),
            verification_status: 'verified',
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
          },
          message: 'Farmer verification approved successfully.',
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/admin/verifications/:id/reject
   * Reject a farmer's verification with a reason.
   */
  async rejectVerification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      // Validate reason
      const { reason } = rejectSchema.parse(req.body);

      // Verify the farmer exists
      const userResult = await pool.query(
        'SELECT id, verification_status FROM users WHERE id = $1 AND role = $2',
        [id, 'farmer']
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Farmer not found.',
        });
        return;
      }

      if (userResult.rows[0].verification_status !== 'pending') {
        res.status(400).json({
          success: false,
          error: `Cannot reject. Farmer's verification status is "${userResult.rows[0].verification_status}". Only "pending" verifications can be rejected.`,
        });
        return;
      }

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Update user status
        await client.query(
          'UPDATE users SET verification_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['rejected', id]
        );

        // Update farmer profile with review info and rejection reason
        await client.query(
          `UPDATE farmer_profiles
           SET verification_notes = $1, reviewed_at = CURRENT_TIMESTAMP,
               reviewed_by = $2, updated_at = CURRENT_TIMESTAMP
           WHERE farmer_id = $3`,
          [reason, adminId, id]
        );

        await client.query('COMMIT');

        res.status(200).json({
          success: true,
          data: {
            farmer_id: parseInt(String(id), 10),
            verification_status: 'rejected',
            reason,
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
          },
          message: 'Farmer verification rejected.',
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  },
};
