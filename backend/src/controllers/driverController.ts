import { Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';

// ── Validation Schemas ─────────────────────────────────────────────────

const updateProfileSchema = z.object({
  vehicle_type: z.enum(['bike', 'motorcycle', 'car', 'truck', 'van']).optional(),
  vehicle_plate: z.string().max(50).optional(),
  service_area: z.string().max(255).optional(),
  service_radius_km: z.number().positive().optional(),
  verification_document_url: z.string().url().optional().nullable(),
  current_lat: z.number().optional().nullable(),
  current_lng: z.number().optional().nullable(),
});

const toggleAvailabilitySchema = z.object({
  is_available: z.boolean(),
});

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Ensure the authenticated user has a DriverProfile row.
 * Creates one if it doesn't exist (minimal defaults).
 */
async function ensureDriverProfile(userId: number): Promise<void> {
  await pool.query(
    `INSERT INTO driver_profiles (user_id, vehicle_type, vehicle_plate, service_area)
     VALUES ($1, 'motorcycle', '', '')
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

// ── Controller Methods ─────────────────────────────────────────────────

export const driverController = {
  /**
   * GET /api/drivers/profile
   * Get the current driver's profile.
   */
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await ensureDriverProfile(req.user!.id);

      const result = await pool.query(
        `SELECT dp.*, u.name, u.email, u.phone, u.avatar_url
         FROM driver_profiles dp
         JOIN users u ON dp.user_id = u.id
         WHERE dp.user_id = $1`,
        [req.user!.id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Driver profile not found.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/drivers/profile
   * Update the current driver's profile.
   */
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await ensureDriverProfile(req.user!.id);
      const data = updateProfileSchema.parse(req.body);

      const fields: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (data.vehicle_type !== undefined) {
        fields.push(`vehicle_type = $${paramIndex++}`);
        values.push(data.vehicle_type);
      }
      if (data.vehicle_plate !== undefined) {
        fields.push(`vehicle_plate = $${paramIndex++}`);
        values.push(data.vehicle_plate);
      }
      if (data.service_area !== undefined) {
        fields.push(`service_area = $${paramIndex++}`);
        values.push(data.service_area);
      }
      if (data.service_radius_km !== undefined) {
        fields.push(`service_radius_km = $${paramIndex++}`);
        values.push(data.service_radius_km);
      }
      if (data.verification_document_url !== undefined) {
        fields.push(`verification_document_url = $${paramIndex++}`);
        values.push(data.verification_document_url);
      }
      if (data.current_lat !== undefined) {
        fields.push(`current_lat = $${paramIndex++}`);
        values.push(data.current_lat);
      }
      if (data.current_lng !== undefined) {
        fields.push(`current_lng = $${paramIndex++}`);
        values.push(data.current_lng);
      }

      if (fields.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No fields to update.',
        });
        return;
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(req.user!.id);

      const result = await pool.query(
        `UPDATE driver_profiles SET ${fields.join(', ')} WHERE user_id = $${paramIndex}
         RETURNING *`,
        values
      );

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Driver profile updated.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/drivers/availability
   * Toggle the current driver's availability status.
   */
  async toggleAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = toggleAvailabilitySchema.parse(req.body);

      const result = await pool.query(
        `UPDATE driver_profiles SET is_available = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2
         RETURNING *`,
        [data.is_available, req.user!.id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Driver profile not found. Complete your profile first.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: data.is_available ? 'You are now accepting deliveries.' : 'You are now offline.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/drivers/deliveries
   * List the current driver's deliveries.
   */
  async getDeliveries(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20', status } = req.query as Record<string, string | undefined>;
      const pageNum = Math.max(1, parseInt(page || '1', 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
      const offset = (pageNum - 1) * limitNum;
      const driverId = req.user!.id;

      const conditions: string[] = ['d.driver_id = $1'];
      const values: unknown[] = [driverId];
      let paramIndex = 2;

      if (status) {
        conditions.push(`d.status = $${paramIndex++}`);
        values.push(status);
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      // Total count
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM deliveries d ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Deliveries with order info
      const result = await pool.query(
        `SELECT d.*,
                o.total_amount, o.created_at AS order_created_at,
                u.name AS buyer_name, u.address AS delivery_address
         FROM deliveries d
         JOIN orders o ON d.order_id = o.id
         JOIN users u ON o.buyer_id = u.id
         ${whereClause}
         ORDER BY d.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...values, limitNum, offset]
      );

      res.status(200).json({
        success: true,
        data: result.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
