import { Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';

// ── Validation Schemas ─────────────────────────────────────────────────

const addCartItemSchema = z.object({
  product_id: z.number().positive('Product ID is required'),
  quantity: z.number().positive('Quantity must be positive').optional().default(1),
});

const updateCartItemSchema = z.object({
  quantity: z.number().positive('Quantity must be positive'),
});

// ── Controller Methods ─────────────────────────────────────────────────

export const cartController = {
  /**
   * GET /api/cart
   * Get the authenticated user's cart items with full product details.
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await pool.query(
        `SELECT ci.id, ci.product_id, ci.quantity, ci.created_at,
                p.name AS product_name, p.price, p.unit, p.image_url,
                p.is_organic, p.is_available, p.farmer_id,
                u.name AS farmer_name
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         JOIN users u ON p.farmer_id = u.id
         WHERE ci.user_id = $1
         ORDER BY ci.created_at DESC`,
        [req.user!.id]
      );

      // Calculate total
      const total = result.rows.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
      );

      res.status(200).json({
        success: true,
        data: {
          items: result.rows,
          total: Number(total.toFixed(2)),
          item_count: result.rows.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/cart
   * Add an item to the cart, or update quantity if it already exists.
   */
  async addItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = addCartItemSchema.parse(req.body);

      // Verify the product exists and is available
      const productResult = await pool.query(
        'SELECT id, name, is_available, quantity FROM products WHERE id = $1',
        [data.product_id]
      );

      if (productResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Product not found.',
        });
        return;
      }

      const product = productResult.rows[0];

      if (!product.is_available) {
        res.status(400).json({
          success: false,
          error: 'This product is currently unavailable.',
        });
        return;
      }

      // Check if item already in cart
      const existingResult = await pool.query(
        'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
        [req.user!.id, data.product_id]
      );

      let result;
      if (existingResult.rows.length > 0) {
        // Update quantity
        const newQuantity = Number(existingResult.rows[0].quantity) + data.quantity;

        if (newQuantity > Number(product.quantity)) {
          res.status(400).json({
            success: false,
            error: `Insufficient stock. Only ${product.quantity} available.`,
          });
          return;
        }

        result = await pool.query(
          `UPDATE cart_items SET quantity = $1 WHERE id = $2
           RETURNING *`,
          [newQuantity, existingResult.rows[0].id]
        );

        res.status(200).json({
          success: true,
          data: result.rows[0],
          message: 'Cart item quantity updated.',
        });
      } else {
        // Add new item
        if (data.quantity > Number(product.quantity)) {
          res.status(400).json({
            success: false,
            error: `Insufficient stock. Only ${product.quantity} available.`,
          });
          return;
        }

        result = await pool.query(
          `INSERT INTO cart_items (user_id, product_id, quantity)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [req.user!.id, data.product_id, data.quantity]
        );

        res.status(201).json({
          success: true,
          data: result.rows[0],
          message: 'Item added to cart.',
        });
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/cart/:id
   * Update the quantity of a cart item.
   */
  async updateItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateCartItemSchema.parse(req.body);

      // Verify cart item belongs to user
      const existing = await pool.query(
        'SELECT ci.*, p.quantity AS available_qty FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = $1 AND ci.user_id = $2',
        [id, req.user!.id]
      );

      if (existing.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Cart item not found.',
        });
        return;
      }

      if (data.quantity > Number(existing.rows[0].available_qty)) {
        res.status(400).json({
          success: false,
          error: `Insufficient stock. Only ${existing.rows[0].available_qty} available.`,
        });
        return;
      }

      const result = await pool.query(
        `UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [data.quantity, id, req.user!.id]
      );

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Cart item quantity updated.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/cart/:id
   * Remove a specific item from the cart.
   */
  async removeItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, req.user!.id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Cart item not found.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Item removed from cart.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/cart
   * Clear all items from the user's cart.
   */
  async clearCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.user!.id]);

      res.status(200).json({
        success: true,
        message: 'Cart cleared successfully.',
      });
    } catch (error) {
      next(error);
    }
  },
};
