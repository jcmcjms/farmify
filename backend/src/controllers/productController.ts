import { Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';

// ── Validation Schemas ─────────────────────────────────────────────────

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().optional().nullable(),
  category: z.string().min(1, 'Category is required').max(100),
  price: z.number().positive('Price must be positive'),
  unit: z.string().max(50).optional().default('kg'),
  quantity: z.number().min(0).optional().default(0),
  image_url: z.string().max(500).optional().nullable(),
  is_organic: z.boolean().optional().default(false),
  is_available: z.boolean().optional().default(true),
});

const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  category: z.string().min(1).max(100).optional(),
  price: z.number().positive().optional(),
  unit: z.string().max(50).optional(),
  quantity: z.number().min(0).optional(),
  image_url: z.string().max(500).optional().nullable(),
  is_organic: z.boolean().optional(),
  is_available: z.boolean().optional(),
});

// ── Controller Methods ─────────────────────────────────────────────────

export const productController = {
  /**
   * GET /api/products
   * List products with optional filters (category, farmer_id, search, is_organic) and pagination.
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        category,
        farmer_id,
        search,
        is_organic,
        page = '1',
        limit = '20',
      } = req.query as Record<string, string | undefined>;

      const pageNum = Math.max(1, parseInt(page || '1', 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
      const offset = (pageNum - 1) * limitNum;

      const conditions: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      conditions.push('p.is_available = true');

      if (category) {
        conditions.push(`p.category = $${paramIndex++}`);
        values.push(category);
      }

      if (farmer_id) {
        conditions.push(`p.farmer_id = $${paramIndex++}`);
        values.push(parseInt(farmer_id, 10));
      }

      if (search) {
        conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
        values.push(`%${search}%`);
        paramIndex++;
      }

      if (is_organic === 'true') {
        conditions.push('p.is_organic = true');
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM products p ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated results with farmer info
      const result = await pool.query(
        `SELECT p.*, u.name AS farmer_name, u.email AS farmer_email
         FROM products p
         JOIN users u ON p.farmer_id = u.id
         ${whereClause}
         ORDER BY p.created_at DESC
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
   * GET /api/products/:id
   * Get a single product by ID with farmer information.
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT p.*, u.name AS farmer_name, u.email AS farmer_email, u.phone AS farmer_phone
         FROM products p
         JOIN users u ON p.farmer_id = u.id
         WHERE p.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Product not found.',
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
   * POST /api/products
   * Create a new product (farmer only).
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createProductSchema.parse(req.body);

      // If user is a farmer, check verification status
      if (req.user!.role === 'farmer') {
        const vResult = await pool.query(
          'SELECT verification_status FROM users WHERE id = $1',
          [req.user!.id]
        );
        if (vResult.rows.length > 0 && vResult.rows[0].verification_status !== 'verified') {
          res.status(403).json({
            success: false,
            error: 'Your account must be verified to sell products. Please complete your farmer verification first.',
          });
          return;
        }
      }

      const result = await pool.query(
        `INSERT INTO products (farmer_id, name, description, category, price, unit, quantity, image_url, is_organic, is_available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          req.user!.id,
          data.name,
          data.description || null,
          data.category,
          data.price,
          data.unit || 'kg',
          data.quantity || 0,
          data.image_url || null,
          data.is_organic || false,
          data.is_available !== undefined ? data.is_available : true,
        ]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Product created successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/products/:id
   * Update a product (owner farmer only).
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateProductSchema.parse(req.body);

      // If user is a farmer, check verification status
      if (req.user!.role === 'farmer') {
        const vResult = await pool.query(
          'SELECT verification_status FROM users WHERE id = $1',
          [req.user!.id]
        );
        if (vResult.rows.length > 0 && vResult.rows[0].verification_status !== 'verified') {
          res.status(403).json({
            success: false,
            error: 'Your account must be verified to sell products. Please complete your farmer verification first.',
          });
          return;
        }
      }

      // Verify ownership
      const existing = await pool.query(
        'SELECT farmer_id FROM products WHERE id = $1',
        [id]
      );

      if (existing.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Product not found.',
        });
        return;
      }

      if (existing.rows[0].farmer_id !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'You can only update your own products.',
        });
        return;
      }

      // Dynamically build SET clause
      const fields: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      const fieldMap: Record<string, unknown> = {
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        unit: data.unit,
        quantity: data.quantity,
        image_url: data.image_url,
        is_organic: data.is_organic,
        is_available: data.is_available,
      };

      for (const [col, val] of Object.entries(fieldMap)) {
        if (val !== undefined) {
          fields.push(`${col} = $${paramIndex++}`);
          values.push(val);
        }
      }

      if (fields.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No fields to update.',
        });
        return;
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const result = await pool.query(
        `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Product updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/products/:id
   * Delete a product (owner farmer only).
   */
  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Verify ownership
      const existing = await pool.query(
        'SELECT farmer_id FROM products WHERE id = $1',
        [id]
      );

      if (existing.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Product not found.',
        });
        return;
      }

      if (existing.rows[0].farmer_id !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'You can only delete your own products.',
        });
        return;
      }

      await pool.query('DELETE FROM products WHERE id = $1', [id]);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  },
};
