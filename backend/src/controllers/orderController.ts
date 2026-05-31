import { Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';

// ── Validation Schemas ─────────────────────────────────────────────────

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.number().positive(),
        quantity: z.number().positive('Quantity must be positive'),
      })
    )
    .min(1, 'At least one item is required'),
  shipping_address: z.string().optional().nullable(),
  payment_method: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
});

// ── Controller Methods ─────────────────────────────────────────────────

export const orderController = {
  /**
   * GET /api/orders
   * List user's orders. Buyers see their own orders; farmers see orders containing their products.
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

      if (role === 'buyer') {
        conditions.push(`o.buyer_id = $${paramIndex++}`);
        values.push(userId);
      } else if (role === 'farmer') {
        // Farmers see orders that contain their products
        conditions.push(`o.id IN (SELECT DISTINCT oi.order_id FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE p.farmer_id = $${paramIndex++})`);
        values.push(userId);
      }
      // Admins see all orders

      if (status) {
        conditions.push(`o.status = $${paramIndex++}`);
        values.push(status);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM orders o ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get orders with buyer info
      const result = await pool.query(
        `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email
         FROM orders o
         JOIN users u ON o.buyer_id = u.id
         ${whereClause}
         ORDER BY o.created_at DESC
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
   * GET /api/orders/buyer/orders
   * Get orders specifically for the current buyer.
   */
  async listBuyerOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20', status } = req.query as Record<string, string | undefined>;
      const pageNum = Math.max(1, parseInt(page || '1', 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
      const offset = (pageNum - 1) * limitNum;
      const userId = req.user!.id;

      const conditions = ['o.buyer_id = $1'];
      const values: unknown[] = [userId];
      let paramIndex = 2;

      if (status) {
        conditions.push(`o.status = $${paramIndex++}`);
        values.push(status);
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM orders o ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);

      const result = await pool.query(
        `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email
         FROM orders o
         JOIN users u ON o.buyer_id = u.id
         ${whereClause}
         ORDER BY o.created_at DESC
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
   * GET /api/orders/:id
   * Get a single order with its items.
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const role = req.user!.role;

      // Get the order
      const orderResult = await pool.query(
        `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email
         FROM orders o
         JOIN users u ON o.buyer_id = u.id
         WHERE o.id = $1`,
        [id]
      );

      if (orderResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Order not found.',
        });
        return;
      }

      const order = orderResult.rows[0];

      // Authorization: buyer owns the order, farmer has products in the order, or admin
      if (
        role !== 'admin' &&
        order.buyer_id !== userId &&
        role === 'farmer'
      ) {
        // Check if farmer has products in this order
        const farmerCheck = await pool.query(
          `SELECT 1 FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = $1 AND p.farmer_id = $2
           LIMIT 1`,
          [id, userId]
        );
        if (farmerCheck.rows.length === 0) {
          res.status(403).json({
            success: false,
            error: 'Access denied. You do not have access to this order.',
          });
          return;
        }
      } else if (role !== 'admin' && order.buyer_id !== userId) {
        res.status(403).json({
          success: false,
          error: 'Access denied. You do not have access to this order.',
        });
        return;
      }

      // Get order items with product details
      const itemsResult = await pool.query(
        `SELECT oi.*, p.name AS product_name, p.image_url AS product_image
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [id]
      );

      order.items = itemsResult.rows;

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/orders
   * Create a new order from cart items (buyer only).
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createOrderSchema.parse(req.body);
      const buyerId = req.user!.id;

      // Validate all products exist and are available, calculate totals
      const productIds = data.items.map((item) => item.product_id);
      const placeholders = productIds.map((_, i) => `$${i + 1}`).join(', ');

      const productsResult = await pool.query(
        `SELECT id, farmer_id, name, price, quantity, is_available FROM products WHERE id IN (${placeholders})`,
        productIds
      );

      if (productsResult.rows.length !== data.items.length) {
        res.status(400).json({
          success: false,
          error: 'One or more products not found.',
        });
        return;
      }

      // Validate availability and quantity
      const productMap = new Map(productsResult.rows.map((p) => [p.id, p]));
      for (const item of data.items) {
        const product = productMap.get(item.product_id);
        if (!product.is_available) {
          res.status(400).json({
            success: false,
            error: `Product "${product.name}" is currently unavailable.`,
          });
          return;
        }
        if (product.quantity < item.quantity) {
          res.status(400).json({
            success: false,
            error: `Insufficient quantity for "${product.name}". Available: ${product.quantity}.`,
          });
          return;
        }
      }

      // Calculate total
      let totalAmount = 0;
      const orderItemsData = data.items.map((item) => {
        const product = productMap.get(item.product_id);
        const subtotal = Number((product.price * item.quantity).toFixed(2));
        totalAmount += subtotal;
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: Number(product.price),
          subtotal,
        };
      });

      totalAmount = Number(totalAmount.toFixed(2));

      // Use a transaction to create the order
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Create the order
        const orderResult = await client.query(
          `INSERT INTO orders (buyer_id, total_amount, shipping_address, payment_method, notes)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [buyerId, totalAmount, data.shipping_address || null, data.payment_method || null, data.notes || null]
        );

        const order = orderResult.rows[0];

        // Insert order items
        for (const item of orderItemsData) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
             VALUES ($1, $2, $3, $4, $5)`,
            [order.id, item.product_id, item.quantity, item.unit_price, item.subtotal]
          );

          // Deduct from product quantity
          await client.query(
            `UPDATE products SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }

        // Clear the user's cart
        await client.query('DELETE FROM cart_items WHERE user_id = $1', [buyerId]);

        await client.query('COMMIT');

        // Fetch the created order with items
        const fullOrder = await pool.query(
          `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email
           FROM orders o
           JOIN users u ON o.buyer_id = u.id
           WHERE o.id = $1`,
          [order.id]
        );

        const itemsResult = await pool.query(
          `SELECT oi.*, p.name AS product_name
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = $1`,
          [order.id]
        );

        fullOrder.rows[0].items = itemsResult.rows;

        res.status(201).json({
          success: true,
          data: fullOrder.rows[0],
          message: 'Order created successfully.',
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
   * PUT /api/orders/:id/status
   * Update order status (farmer/admin only).
   */
  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateStatusSchema.parse(req.body);

      // Check the order exists
      const existing = await pool.query('SELECT id, buyer_id, status FROM orders WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Order not found.',
        });
        return;
      }

      // Farmers can only update orders containing their products
      if (req.user!.role === 'farmer') {
        const farmerCheck = await pool.query(
          `SELECT 1 FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = $1 AND p.farmer_id = $2
           LIMIT 1`,
          [id, req.user!.id]
        );
        if (farmerCheck.rows.length === 0) {
          res.status(403).json({
            success: false,
            error: 'You can only update status for orders containing your products.',
          });
          return;
        }
      }

      const result = await pool.query(
        `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
         RETURNING *`,
        [data.status, id]
      );

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: `Order status updated to "${data.status}".`,
      });
    } catch (error) {
      next(error);
    }
  },
};
