import { Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';

// ── Validation Schemas ─────────────────────────────────────────────────

const updateStatusSchema = z.object({
  status: z.enum(['waiting_assignment', 'assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled']),
  notes: z.string().optional().nullable(),
});

// ── Controller Methods ─────────────────────────────────────────────────

export const deliveryController = {
  /**
   * GET /api/deliveries
   * List deliveries — farmers see deliveries for their products, admins see all.
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20', status } = req.query as Record<string, string | undefined>;
      const pageNum = Math.max(1, parseInt(page || '1', 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
      const offset = (pageNum - 1) * limitNum;
      const userId = req.user!.id;
      const role = req.user!.role;

      const conditions: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (role === 'farmer') {
        conditions.push(`d.farmer_id = $${paramIndex++}`);
        values.push(userId);
      }
      // Admins see all, drivers use their own endpoint

      if (status) {
        conditions.push(`d.status = $${paramIndex++}`);
        values.push(status);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Total count
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM deliveries d ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Deliveries with related info
      const result = await pool.query(
        `SELECT d.*,
                o.total_amount, o.created_at AS order_created_at,
                buyer.name AS buyer_name,
                driver.name AS driver_name, dr.vehicle_type AS driver_vehicle, driver.phone AS driver_phone
         FROM deliveries d
         JOIN orders o ON d.order_id = o.id
         JOIN users buyer ON o.buyer_id = buyer.id
         LEFT JOIN users driver ON d.driver_id = driver.id
         LEFT JOIN driver_profiles dr ON d.driver_id = dr.user_id
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

  /**
   * GET /api/deliveries/:id
   * Get a single delivery by ID.
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT d.*,
                o.total_amount, o.shipping_address, o.notes AS order_notes, o.created_at AS order_created_at,
                oi.product_id, oi.quantity, oi.unit_price, oi.subtotal,
                p.name AS product_name, p.image_url AS product_image,
                buyer.id AS buyer_id, buyer.name AS buyer_name, buyer.email AS buyer_email, buyer.phone AS buyer_phone,
                farmer.id AS farmer_id, farmer.name AS farmer_name, farmer.phone AS farmer_phone,
                driver.id AS driver_id, driver.name AS driver_name, driver.phone AS driver_phone,
                dr.vehicle_type AS driver_vehicle
         FROM deliveries d
         JOIN orders o ON d.order_id = o.id
         JOIN order_items oi ON o.id = oi.order_id
         JOIN products p ON oi.product_id = p.id
         JOIN users buyer ON o.buyer_id = buyer.id
         JOIN users farmer ON d.farmer_id = farmer.id
         LEFT JOIN users driver ON d.driver_id = driver.id
         LEFT JOIN driver_profiles dr ON d.driver_id = dr.user_id
         WHERE d.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Delivery not found.',
        });
        return;
      }

      // Group items under the delivery
      const row = result.rows[0];
      const items = result.rows.map((r: Record<string, unknown>) => ({
        product_id: r.product_id,
        product_name: r.product_name,
        product_image: r.product_image,
        quantity: r.quantity,
        unit_price: r.unit_price,
        subtotal: r.subtotal,
      }));

      const delivery = {
        id: row.id,
        order_id: row.order_id,
        driver_id: row.driver_id,
        farmer_id: row.farmer_id,
        status: row.status,
        assigned_at: row.assigned_at,
        accepted_at: row.accepted_at,
        picked_up_at: row.picked_up_at,
        delivered_at: row.delivered_at,
        pickup_notes: row.pickup_notes,
        delivery_notes: row.delivery_notes,
        driver_rating: row.driver_rating,
        buyer_rating: row.buyer_rating,
        created_at: row.created_at,
        updated_at: row.updated_at,
        total_amount: row.total_amount,
        shipping_address: row.shipping_address,
        order_notes: row.order_notes,
        order_created_at: row.order_created_at,
        items,
        buyer: {
          id: row.buyer_id,
          name: row.buyer_name,
          email: row.buyer_email,
          phone: row.buyer_phone,
        },
        farmer: {
          id: row.farmer_id,
          name: row.farmer_name,
          phone: row.farmer_phone,
        },
        driver: row.driver_id
          ? { id: row.driver_id, name: row.driver_name, phone: row.driver_phone, vehicle: row.driver_vehicle }
          : null,
      };

      res.status(200).json({
        success: true,
        data: delivery,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/deliveries/:id/accept
   * Driver accepts a delivery assignment.
   */
  async acceptDelivery(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const driverId = req.user!.id;

      // Verify delivery exists and is in 'assigned' status
      const delivery = await pool.query(
        'SELECT * FROM deliveries WHERE id = $1',
        [id]
      );

      if (delivery.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Delivery not found.',
        });
        return;
      }

      const d = delivery.rows[0];
      if (d.status !== 'assigned') {
        res.status(400).json({
          success: false,
          error: `Cannot accept delivery in "${d.status}" status. Only "assigned" deliveries can be accepted.`,
        });
        return;
      }

      if (d.driver_id !== driverId) {
        res.status(403).json({
          success: false,
          error: 'This delivery was assigned to a different driver.',
        });
        return;
      }

      const result = await pool.query(
        `UPDATE deliveries SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Delivery accepted.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/deliveries/:id/status
   * Update delivery status (driver or farmer).
   */
  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateStatusSchema.parse(req.body);

      // Check delivery exists
      const existing = await pool.query('SELECT * FROM deliveries WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Delivery not found.',
        });
        return;
      }

      const d = existing.rows[0];

      // Set timestamp fields based on new status
      const timestampField: Record<string, string> = {
        accepted: 'accepted_at',
        picked_up: 'picked_up_at',
        delivered: 'delivered_at',
      };

      const timestampCol = timestampField[data.status];

      let result;
      if (timestampCol) {
        result = await pool.query(
          `UPDATE deliveries SET status = $1, ${timestampCol} = CURRENT_TIMESTAMP,
           delivery_notes = COALESCE($2, delivery_notes), updated_at = CURRENT_TIMESTAMP
           WHERE id = $3 RETURNING *`,
          [data.status, data.notes || null, id]
        );
      } else {
        result = await pool.query(
          `UPDATE deliveries SET status = $1,
           delivery_notes = COALESCE($2, delivery_notes), updated_at = CURRENT_TIMESTAMP
           WHERE id = $3 RETURNING *`,
          [data.status, data.notes || null, id]
        );
      }

      // If delivery is picked up, also update the order status
      if (data.status === 'picked_up') {
        await pool.query(
          `UPDATE orders SET status = 'picked_up', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [d.order_id]
        );
      } else if (data.status === 'delivered') {
        await pool.query(
          `UPDATE orders SET status = 'delivered', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [d.order_id]
        );
      } else if (data.status === 'cancelled' || data.status === 'failed') {
        await pool.query(
          `UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [d.order_id]
        );
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: `Delivery status updated to "${data.status}".`,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/orders/:orderId/delivery
   * Get delivery for a specific order.
   */
  async getByOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;

      const result = await pool.query(
        `SELECT d.*,
                driver.name AS driver_name,
                dr.vehicle_type AS driver_vehicle,
                driver.phone AS driver_phone
         FROM deliveries d
         LEFT JOIN users driver ON d.driver_id = driver.id
         LEFT JOIN driver_profiles dr ON d.driver_id = dr.user_id
         WHERE d.order_id = $1`,
        [orderId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No delivery found for this order.',
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
};
