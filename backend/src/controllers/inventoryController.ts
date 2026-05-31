import { Response, NextFunction } from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';

// ── Validation Schemas ─────────────────────────────────────────────────

const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(255),
  category: z.string().min(1, 'Category is required').max(100),
  quantity: z.number().min(0).optional().default(0),
  unit: z.string().max(50).optional().default('units'),
  min_quantity: z.number().min(0).optional().default(0),
  unit_cost: z.number().min(0).optional().default(0),
  supplier: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateInventoryItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.string().min(1).max(100).optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().max(50).optional(),
  min_quantity: z.number().min(0).optional(),
  unit_cost: z.number().min(0).optional(),
  supplier: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const addTransactionSchema = z.object({
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number().positive('Quantity must be positive'),
  reference_type: z.string().max(100).optional().nullable(),
  reference_id: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ── Controller Methods ─────────────────────────────────────────────────

export const inventoryController = {
  /**
   * GET /api/inventory
   * List inventory items for the authenticated farmer.
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, page = '1', limit = '20' } = req.query as Record<string, string | undefined>;
      const pageNum = Math.max(1, parseInt(page || '1', 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
      const offset = (pageNum - 1) * limitNum;
      const farmerId = req.user!.id;

      const conditions: string[] = ['i.farmer_id = $1'];
      const values: unknown[] = [farmerId];
      let paramIndex = 2;

      // Admin can filter by farmer_id
      if (req.user!.role === 'admin' && req.query.farmer_id) {
        conditions[0] = `i.farmer_id = $1`;
        values[0] = parseInt(req.query.farmer_id as string, 10);
      }

      if (category) {
        conditions.push(`i.category = $${paramIndex++}`);
        values.push(category);
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM inventory_items i ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count, 10);

      const result = await pool.query(
        `SELECT i.*,
                (SELECT COALESCE(SUM(CASE WHEN type = 'in' THEN quantity WHEN type = 'out' THEN -quantity ELSE 0 END), 0)
                 FROM inventory_transactions it WHERE it.item_id = i.id) AS calculated_quantity
         FROM inventory_items i
         ${whereClause}
         ORDER BY i.name ASC
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
   * GET /api/inventory/alerts/low-stock
   * Get items below minimum quantity for the authenticated farmer.
   */
  async lowStock(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const farmerId = req.user!.id;

      const result = await pool.query(
        `SELECT * FROM inventory_items
         WHERE farmer_id = $1 AND quantity <= min_quantity
         ORDER BY (quantity - min_quantity) ASC`,
        [farmerId]
      );

      res.status(200).json({
        success: true,
        data: result.rows,
        message:
          result.rows.length > 0
            ? `${result.rows.length} item(s) are low on stock.`
            : 'All items are adequately stocked.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/inventory/:id
   * Get a single inventory item with its transactions.
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'SELECT * FROM inventory_items WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Inventory item not found.',
        });
        return;
      }

      const item = result.rows[0];

      // Authorization: owner farmer or admin
      if (item.farmer_id !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Access denied. You can only view your own inventory items.',
        });
        return;
      }

      // Get recent transactions
      const transactions = await pool.query(
        `SELECT * FROM inventory_transactions
         WHERE item_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [id]
      );

      item.transactions = transactions.rows;

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/inventory
   * Create a new inventory item (farmer only).
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createInventoryItemSchema.parse(req.body);

      const result = await pool.query(
        `INSERT INTO inventory_items (farmer_id, name, category, quantity, unit, min_quantity, unit_cost, supplier, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          req.user!.id,
          data.name,
          data.category,
          data.quantity || 0,
          data.unit || 'units',
          data.min_quantity || 0,
          data.unit_cost || 0,
          data.supplier || null,
          data.notes || null,
        ]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Inventory item created successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/inventory/:id
   * Update an inventory item (owner farmer only).
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateInventoryItemSchema.parse(req.body);

      // Verify ownership
      const existing = await pool.query(
        'SELECT farmer_id FROM inventory_items WHERE id = $1',
        [id]
      );

      if (existing.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Inventory item not found.',
        });
        return;
      }

      if (existing.rows[0].farmer_id !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'You can only update your own inventory items.',
        });
        return;
      }

      // Dynamically build SET clause
      const fields: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      const fieldMap: Record<string, unknown> = {
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        min_quantity: data.min_quantity,
        unit_cost: data.unit_cost,
        supplier: data.supplier,
        notes: data.notes,
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
        `UPDATE inventory_items SET ${fields.join(', ')} WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Inventory item updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/inventory/:id
   * Delete an inventory item (owner farmer only).
   */
  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await pool.query(
        'SELECT farmer_id FROM inventory_items WHERE id = $1',
        [id]
      );

      if (existing.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Inventory item not found.',
        });
        return;
      }

      if (existing.rows[0].farmer_id !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'You can only delete your own inventory items.',
        });
        return;
      }

      await pool.query('DELETE FROM inventory_items WHERE id = $1', [id]);

      res.status(200).json({
        success: true,
        message: 'Inventory item deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/inventory/:id/transaction
   * Add a transaction (in/out/adjustment) and update the item quantity.
   */
  async addTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = addTransactionSchema.parse(req.body);

      // Verify item exists and ownership
      const itemResult = await pool.query(
        'SELECT * FROM inventory_items WHERE id = $1',
        [id]
      );

      if (itemResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Inventory item not found.',
        });
        return;
      }

      const item = itemResult.rows[0];

      if (item.farmer_id !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'You can only manage your own inventory items.',
        });
        return;
      }

      // Use a transaction to record and update
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Insert the transaction record
        const transactionResult = await client.query(
          `INSERT INTO inventory_transactions (item_id, type, quantity, reference_type, reference_id, notes)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            id,
            data.type,
            data.quantity,
            data.reference_type || null,
            data.reference_id || null,
            data.notes || null,
          ]
        );

        // Update item quantity
        let newQuantity: number;
        if (data.type === 'in') {
          newQuantity = Number(item.quantity) + data.quantity;
        } else if (data.type === 'out') {
          newQuantity = Number(item.quantity) - data.quantity;
        } else {
          // adjustment — quantity field represents the new total
          newQuantity = data.quantity;
        }

        if (newQuantity < 0) {
          await client.query('ROLLBACK');
          res.status(400).json({
            success: false,
            error: 'Transaction would result in negative inventory quantity.',
          });
          return;
        }

        await client.query(
          `UPDATE inventory_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [newQuantity, id]
        );

        await client.query('COMMIT');

        // Return the updated item with the new transaction
        const updatedItem = await pool.query(
          'SELECT * FROM inventory_items WHERE id = $1',
          [id]
        );

        res.status(201).json({
          success: true,
          data: {
            item: updatedItem.rows[0],
            transaction: transactionResult.rows[0],
          },
          message: `Transaction recorded: ${data.type} of ${data.quantity}. New quantity: ${newQuantity}.`,
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
   * GET /api/inventory/:id/transactions
   * List all transactions for an inventory item.
   */
  async listTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Verify item exists and ownership
      const itemResult = await pool.query(
        'SELECT farmer_id FROM inventory_items WHERE id = $1',
        [id]
      );

      if (itemResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Inventory item not found.',
        });
        return;
      }

      if (itemResult.rows[0].farmer_id !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Access denied.',
        });
        return;
      }

      const result = await pool.query(
        `SELECT * FROM inventory_transactions
         WHERE item_id = $1
         ORDER BY created_at DESC`,
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
};
