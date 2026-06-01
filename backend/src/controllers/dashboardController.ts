import { Response, NextFunction } from 'express';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';

/**
 * Dashboard controller — provides stats for the currently authenticated
 * non-admin user (farmer or buyer).
 */
export const dashboardController = {
  /**
   * GET /api/dashboard/stats
   * Returns role-specific aggregate counts for the authenticated user.
   *
   * For farmers: total_products, active_jobs, inventory_items, orders_received
   * For buyers:  orders_placed, cart_items
   */
  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const role = req.user!.role;

      let stats: Record<string, number> = {};

      if (role === 'farmer') {
        const result = await pool.query(
          `SELECT
              (SELECT COUNT(*) FROM products WHERE farmer_id = $1)             AS total_products,
              (SELECT COUNT(*) FROM jobs WHERE farmer_id = $1 AND is_active = true) AS active_jobs,
              (SELECT COUNT(*) FROM inventory_items WHERE farmer_id = $1)       AS inventory_items,
              (SELECT COUNT(*) FROM orders o
               JOIN order_items oi ON o.id = oi.order_id
               JOIN products p ON oi.product_id = p.id
               WHERE p.farmer_id = $1)                                         AS orders_received`,
          [userId]
        );
        stats = result.rows[0];
      } else if (role === 'buyer') {
        const result = await pool.query(
          `SELECT
              (SELECT COUNT(*) FROM orders WHERE buyer_id = $1)   AS orders_placed,
              (SELECT COUNT(*) FROM cart_items WHERE user_id = $1) AS cart_items`,
          [userId]
        );
        stats = result.rows[0];
      }

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
};
