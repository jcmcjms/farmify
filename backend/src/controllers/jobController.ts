import { Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';

// ── Validation Schemas ─────────────────────────────────────────────────

const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(255),
  description: z.string().min(1, 'Job description is required'),
  category: z.string().min(1, 'Category is required').max(100),
  location: z.string().max(255).optional().nullable(),
  salary_min: z.number().min(0).optional().nullable(),
  salary_max: z.number().min(0).optional().nullable(),
  salary_type: z.enum(['fixed', 'daily', 'hourly', 'negotiable']).optional().default('fixed'),
  employment_type: z
    .enum(['full-time', 'part-time', 'seasonal', 'contract', 'temporary'])
    .optional()
    .default('full-time'),
  requirements: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

const updateJobSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).max(100).optional(),
  location: z.string().max(255).optional().nullable(),
  salary_min: z.number().min(0).optional().nullable(),
  salary_max: z.number().min(0).optional().nullable(),
  salary_type: z.enum(['fixed', 'daily', 'hourly', 'negotiable']).optional(),
  employment_type: z
    .enum(['full-time', 'part-time', 'seasonal', 'contract', 'temporary'])
    .optional(),
  requirements: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

const applyJobSchema = z.object({
  cover_letter: z.string().optional().nullable(),
});

const updateApplicationStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected']),
});

// ── Controller Methods ─────────────────────────────────────────────────

export const jobController = {
  /**
   * GET /api/jobs
   * List jobs with filters (category, location, employment_type, is_active) and pagination.
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        category,
        location,
        employment_type,
        is_active,
        page = '1',
        limit = '20',
      } = req.query as Record<string, string | undefined>;

      const pageNum = Math.max(1, parseInt(page || '1', 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
      const offset = (pageNum - 1) * limitNum;

      const conditions: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      // By default, show only active jobs for non-farmer/admins
      conditions.push('j.is_active = true');

      if (category) {
        conditions.push(`j.category = $${paramIndex++}`);
        values.push(category);
      }

      if (location) {
        conditions.push(`j.location ILIKE $${paramIndex++}`);
        values.push(`%${location}%`);
      }

      if (employment_type) {
        conditions.push(`j.employment_type = $${paramIndex++}`);
        values.push(employment_type);
      }

      if (is_active === 'false') {
        // Override the default when explicitly asking for inactive
        conditions[conditions.indexOf('j.is_active = true')] = 'j.is_active = false';
      } else if (is_active === 'all' && req.user?.role) {
        // Show all if explicitly requested
        conditions.splice(conditions.indexOf('j.is_active = true'), 1);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM jobs j ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated results with farmer info and application count
      const result = await pool.query(
        `SELECT j.*, u.name AS farmer_name, u.email AS farmer_email,
                (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) AS applications_count
         FROM jobs j
         JOIN users u ON j.farmer_id = u.id
         ${whereClause}
         ORDER BY j.created_at DESC
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
   * GET /api/jobs/:id
   * Get a single job with applications count.
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT j.*, u.name AS farmer_name, u.email AS farmer_email, u.phone AS farmer_phone,
                (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) AS applications_count
         FROM jobs j
         JOIN users u ON j.farmer_id = u.id
         WHERE j.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Job not found.',
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
   * POST /api/jobs
   * Create a new job (farmer only).
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createJobSchema.parse(req.body);

      // If user is a farmer, check verification status
      if (req.user!.role === 'farmer') {
        const vResult = await pool.query(
          'SELECT verification_status FROM users WHERE id = $1',
          [req.user!.id]
        );
        if (vResult.rows.length > 0 && vResult.rows[0].verification_status !== 'verified') {
          res.status(403).json({
            success: false,
            error: 'Your account must be verified to post jobs. Please complete your farmer verification first.',
          });
          return;
        }
      }

      const result = await pool.query(
        `INSERT INTO jobs (farmer_id, title, description, category, location, salary_min, salary_max, salary_type, employment_type, requirements, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          req.user!.id,
          data.title,
          data.description,
          data.category,
          data.location || null,
          data.salary_min || null,
          data.salary_max || null,
          data.salary_type || 'fixed',
          data.employment_type || 'full-time',
          data.requirements || null,
          data.is_active !== undefined ? data.is_active : true,
        ]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Job created successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/jobs/:id
   * Update a job (owner farmer only).
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateJobSchema.parse(req.body);

      // If user is a farmer, check verification status
      if (req.user!.role === 'farmer') {
        const vResult = await pool.query(
          'SELECT verification_status FROM users WHERE id = $1',
          [req.user!.id]
        );
        if (vResult.rows.length > 0 && vResult.rows[0].verification_status !== 'verified') {
          res.status(403).json({
            success: false,
            error: 'Your account must be verified to post jobs. Please complete your farmer verification first.',
          });
          return;
        }
      }

      // Verify ownership
      const existing = await pool.query(
        'SELECT farmer_id FROM jobs WHERE id = $1',
        [id]
      );

      if (existing.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Job not found.',
        });
        return;
      }

      if (existing.rows[0].farmer_id !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'You can only update your own jobs.',
        });
        return;
      }

      // Dynamically build SET clause
      const fields: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      const fieldMap: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        salary_min: data.salary_min,
        salary_max: data.salary_max,
        salary_type: data.salary_type,
        employment_type: data.employment_type,
        requirements: data.requirements,
        is_active: data.is_active,
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
        `UPDATE jobs SET ${fields.join(', ')} WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Job updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/jobs/:id
   * Delete a job (owner farmer only).
   */
  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await pool.query(
        'SELECT farmer_id FROM jobs WHERE id = $1',
        [id]
      );

      if (existing.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Job not found.',
        });
        return;
      }

      if (existing.rows[0].farmer_id !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'You can only delete your own jobs.',
        });
        return;
      }

      await pool.query('DELETE FROM jobs WHERE id = $1', [id]);

      res.status(200).json({
        success: true,
        message: 'Job deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/jobs/:id/apply
   * Apply for a job (authenticated user).
   */
  async apply(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = applyJobSchema.parse(req.body);

      // Check job exists and is active
      const jobResult = await pool.query(
        'SELECT id, farmer_id, is_active FROM jobs WHERE id = $1',
        [id]
      );

      if (jobResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Job not found.',
        });
        return;
      }

      if (!jobResult.rows[0].is_active) {
        res.status(400).json({
          success: false,
          error: 'This job is no longer accepting applications.',
        });
        return;
      }

      // Cannot apply to your own job
      if (jobResult.rows[0].farmer_id === req.user!.id) {
        res.status(400).json({
          success: false,
          error: 'You cannot apply to your own job posting.',
        });
        return;
      }

      // Check for duplicate application
      const existingApplication = await pool.query(
        'SELECT id FROM job_applications WHERE job_id = $1 AND applicant_id = $2',
        [id, req.user!.id]
      );

      if (existingApplication.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: 'You have already applied to this job.',
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO job_applications (job_id, applicant_id, cover_letter)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [id, req.user!.id, data.cover_letter || null]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Application submitted successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/jobs/:id/applications
   * List applications for a job (owner farmer only).
   */
  async listApplications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Verify job ownership
      const jobResult = await pool.query(
        'SELECT farmer_id FROM jobs WHERE id = $1',
        [id]
      );

      if (jobResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Job not found.',
        });
        return;
      }

      if (jobResult.rows[0].farmer_id !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'You can only view applications for your own jobs.',
        });
        return;
      }

      const result = await pool.query(
        `SELECT ja.*, u.name AS applicant_name, u.email AS applicant_email, u.phone AS applicant_phone
         FROM job_applications ja
         JOIN users u ON ja.applicant_id = u.id
         WHERE ja.job_id = $1
         ORDER BY ja.created_at DESC`,
        [id]
      );

      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/jobs/applications/:id/status
   * Update application status (farmer only, must own the job).
   */
  async updateApplicationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateApplicationStatusSchema.parse(req.body);

      // Get the application with job info
      const appResult = await pool.query(
        `SELECT ja.*, j.farmer_id
         FROM job_applications ja
         JOIN jobs j ON ja.job_id = j.id
         WHERE ja.id = $1`,
        [id]
      );

      if (appResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Application not found.',
        });
        return;
      }

      if (appResult.rows[0].farmer_id !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'You can only update applications for your own jobs.',
        });
        return;
      }

      const result = await pool.query(
        `UPDATE job_applications SET status = $1 WHERE id = $2
         RETURNING *`,
        [data.status, id]
      );

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: `Application status updated to "${data.status}".`,
      });
    } catch (error) {
      next(error);
    }
  },
};
