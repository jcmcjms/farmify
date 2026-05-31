import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';

// ── Validation Schemas ─────────────────────────────────────────────────

const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  role: z.enum(['admin', 'farmer', 'buyer']).optional(),
});

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(255),
  role: z.enum(['admin', 'farmer', 'buyer']),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().optional().nullable(),
});

const updateUserSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255).optional(),
    email: z.string().email('Invalid email address').max(255).optional(),
    role: z.enum(['admin', 'farmer', 'buyer']).optional(),
    phone: z.string().max(50).optional().nullable(),
    address: z.string().optional().nullable(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided for update.',
  });

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Generate a random alphanumeric password of the given length.
 */
function generateRandomPassword(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

// ── Controller Methods ─────────────────────────────────────────────────

export const adminController = {
  /**
   * GET /api/admin/users
   * List all users with optional search/role filters and pagination.
   */
  async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, role } = listUsersSchema.parse(req.query);

      const conditions: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (search) {
        conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
        values.push(`%${search}%`);
        paramIndex++;
      }
      if (role) {
        conditions.push(`role = $${paramIndex}`);
        values.push(role);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count total matching records
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM users ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      // Fetch the page of results
      values.push(limit, offset);
      const dataResult = await pool.query(
        `SELECT id, name, email, role, phone, address, avatar_url, created_at, updated_at
         FROM users ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        values
      );

      res.status(200).json({
        success: true,
        data: dataResult.rows,
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
   * GET /api/admin/users/:id
   * Get a single user with aggregate counts (products, orders, jobs, inventory).
   */
  async getUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT u.id,
                u.name,
                u.email,
                u.role,
                u.phone,
                u.address,
                u.avatar_url,
                u.created_at,
                u.updated_at,
                (SELECT COUNT(*) FROM products WHERE farmer_id = u.id)          AS total_products,
                (SELECT COUNT(*) FROM orders WHERE buyer_id = u.id)             AS total_orders,
                (SELECT COUNT(*) FROM jobs WHERE farmer_id = u.id)              AS total_jobs,
                (SELECT COUNT(*) FROM inventory_items WHERE farmer_id = u.id)   AS total_inventory_items
         FROM users u
         WHERE u.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found.',
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
   * POST /api/admin/users
   * Create a new user account.
   */
  async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createUserSchema.parse(req.body);

      // Check email uniqueness
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [data.email]);
      if (existing.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: 'A user with this email already exists.',
        });
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      // Insert user
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role, phone, address)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, email, role, phone, address, avatar_url, created_at, updated_at`,
        [data.name, data.email, hashedPassword, data.role, data.phone ?? null, data.address ?? null]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'User created successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/admin/users/:id
   * Update a user's profile fields.
   */
  async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateUserSchema.parse(req.body);

      // Prevent admin from changing their own role
      if (req.user!.id === parseInt(String(id), 10) && data.role) {
        res.status(403).json({
          success: false,
          error: 'You cannot change your own role.',
        });
        return;
      }

      // Check email uniqueness if changing email
      if (data.email) {
        const existing = await pool.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [data.email, id]
        );
        if (existing.rows.length > 0) {
          res.status(409).json({
            success: false,
            error: 'A user with this email already exists.',
          });
          return;
        }
      }

      // Build dynamic UPDATE query
      const fields: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.email !== undefined) {
        fields.push(`email = $${paramIndex++}`);
        values.push(data.email);
      }
      if (data.role !== undefined) {
        fields.push(`role = $${paramIndex++}`);
        values.push(data.role);
      }
      if (data.phone !== undefined) {
        fields.push(`phone = $${paramIndex++}`);
        values.push(data.phone);
      }
      if (data.address !== undefined) {
        fields.push(`address = $${paramIndex++}`);
        values.push(data.address);
      }

      // Always bump the timestamp
      fields.push('updated_at = CURRENT_TIMESTAMP');

      values.push(id);
      const result = await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
         RETURNING id, name, email, role, phone, address, avatar_url, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'User updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/admin/users/:id
   * Delete a user account. CASCADE handles related records.
   */
  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = parseInt(String(id), 10);

      if (req.user!.id === userId) {
        res.status(403).json({
          success: false,
          error: 'You cannot delete your own account.',
        });
        return;
      }

      const result = await pool.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/admin/users/:id/reset-password
   * Reset a user's password to a random 10-character string.
   * Returns the new plaintext password so the admin can share it.
   */
  async resetPassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Verify user exists
      const existing = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found.',
        });
        return;
      }

      // Generate cryptographically random password
      const newPassword = generateRandomPassword(10);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await pool.query(
        'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, id]
      );

      res.status(200).json({
        success: true,
        data: { new_password: newPassword },
        message: 'Password reset successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/roles
   * List all built-in roles with user counts and permission descriptions.
   */
  async listRoles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const countResult = await pool.query(
        `SELECT role, COUNT(*)::int AS user_count FROM users GROUP BY role`
      );

      const roleCounts: Record<string, number> = {};
      for (const row of countResult.rows) {
        roleCounts[row.role] = row.user_count;
      }

      const roles = [
        {
          name: 'admin',
          description: 'Full system access. Can manage users, products, orders, jobs, and inventory.',
          user_count: roleCounts['admin'] ?? 0,
          permissions: [
            'users.manage',
            'products.manage',
            'orders.manage',
            'jobs.manage',
            'inventory.manage',
          ],
        },
        {
          name: 'farmer',
          description: 'Can create and manage products, jobs, and inventory. Can view orders.',
          user_count: roleCounts['farmer'] ?? 0,
          permissions: [
            'products.create',
            'products.edit',
            'products.delete',
            'jobs.create',
            'jobs.edit',
            'jobs.delete',
            'inventory.manage',
            'orders.view',
          ],
        },
        {
          name: 'buyer',
          description: 'Can browse products, place orders, apply for jobs, and manage cart.',
          user_count: roleCounts['buyer'] ?? 0,
          permissions: [
            'products.view',
            'orders.create',
            'orders.view',
            'jobs.apply',
            'cart.manage',
          ],
        },
      ];

      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/stats
   * Return aggregate system statistics.
   */
  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM users)                                             AS total_users,
          (SELECT COUNT(*) FROM products)                                          AS total_products,
          (SELECT COUNT(*) FROM orders)                                            AS total_orders,
          (SELECT COUNT(*) FROM jobs)                                              AS total_jobs,
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered') AS total_revenue
      `);

      res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  },
};
