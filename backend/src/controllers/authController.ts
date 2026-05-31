import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ── Validation Schemas ─────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(255),
  role: z.enum(['farmer', 'buyer']).optional().default('buyer'),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().optional().nullable(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
});

// ── Helpers ────────────────────────────────────────────────────────────

function generateToken(user: { id: number; name: string; email: string; role: string }): string {
  // expiresIn accepts string values like "7d", "24h", "3600" (seconds)
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

function sanitizeUser(user: { id: number; name: string; email: string; role: string; phone: string | null; address: string | null; avatar_url: string | null; created_at: string; updated_at: string }) {
  const { password: _, ...safeUser } = user as any;
  return safeUser;
}

// ── Controller Methods ─────────────────────────────────────────────────

export const authController = {
  /**
   * POST /api/auth/register
   * Create a new user account. Returns JWT + user data.
   */
  async register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = registerSchema.parse(req.body);

      // Check if email already exists
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [data.email]);
      if (existing.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: 'An account with this email already exists.',
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
        [data.name, data.email, hashedPassword, data.role || 'buyer', data.phone || null, data.address || null]
      );

      const user = result.rows[0];
      const token = generateToken(user);

      res.status(201).json({
        success: true,
        data: {
          user: sanitizeUser(user),
          token,
        },
        message: 'Registration successful.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/login
   * Authenticate with email and password. Returns JWT + user data.
   */
  async login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);

      // Find user by email
      const result = await pool.query(
        'SELECT id, name, email, password, role, phone, address, avatar_url, created_at, updated_at FROM users WHERE email = $1',
        [data.email]
      );

      if (result.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
        });
        return;
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
        });
        return;
      }

      const token = generateToken(user);

      res.status(200).json({
        success: true,
        data: {
          user: sanitizeUser(user),
          token,
        },
        message: 'Login successful.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/me
   * Get the currently authenticated user's profile.
   */
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await pool.query(
        'SELECT id, name, email, role, phone, address, avatar_url, created_at, updated_at FROM users WHERE id = $1',
        [req.user!.id]
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
   * PUT /api/auth/profile
   * Update the current user's profile fields.
   */
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateProfileSchema.parse(req.body);

      const fields: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.phone !== undefined) {
        fields.push(`phone = $${paramIndex++}`);
        values.push(data.phone);
      }
      if (data.address !== undefined) {
        fields.push(`address = $${paramIndex++}`);
        values.push(data.address);
      }
      if (data.avatar_url !== undefined) {
        fields.push(`avatar_url = $${paramIndex++}`);
        values.push(data.avatar_url);
      }

      if (fields.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No fields to update.',
        });
        return;
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(req.user!.id);

      const result = await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
         RETURNING id, name, email, role, phone, address, avatar_url, created_at, updated_at`,
        values
      );

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Profile updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  },
};
