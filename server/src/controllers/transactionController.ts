import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { CreateTransactionDTO, UpdateTransactionDTO } from '../types';

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { accountbook_id, type, amount, category_id, date, memo }: CreateTransactionDTO = req.body;
    const userId = req.user!.userId;

    // Validate input
    if (!accountbook_id || !type || !amount || !date) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Check if user has access
    const memberCheck = await pool.query(
      'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2',
      [accountbook_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create transaction
    const result = await pool.query(
      `INSERT INTO transactions (accountbook_id, type, amount, category_id, date, memo, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [accountbook_id, type, amount, category_id || null, date, memo || null, userId]
    );

    const transaction = result.rows[0];

    // Get category name if exists
    if (transaction.category_id) {
      const categoryResult = await pool.query(
        'SELECT name, color FROM categories WHERE id = $1',
        [transaction.category_id]
      );
      transaction.category_name = categoryResult.rows[0]?.name;
      transaction.category_color = categoryResult.rows[0]?.color;
    }

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction,
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Server error creating transaction' });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { accountbookId } = req.params;
    const { startDate, endDate, type, categoryId } = req.query;
    const userId = req.user!.userId;

    // Check if user has access
    const memberCheck = await pool.query(
      'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2',
      [accountbookId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build query
    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color, u.name as created_by_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.accountbook_id = $1
    `;
    const params: any[] = [accountbookId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND t.date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND t.date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (type) {
      query += ` AND t.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (categoryId) {
      query += ` AND t.category_id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    const result = await pool.query(query, params);

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Server error fetching transactions' });
  }
};

export const getTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const result = await pool.query(
      `SELECT t.*, c.name as category_name, c.color as category_color, u.name as created_by_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = result.rows[0];

    // Check if user has access
    const memberCheck = await pool.query(
      'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2',
      [transaction.accountbook_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Server error fetching transaction' });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates: UpdateTransactionDTO = req.body;
    const userId = req.user!.userId;

    // Get transaction
    const transactionResult = await pool.query(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactionResult.rows[0];

    // Check if user has access
    const memberCheck = await pool.query(
      'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2',
      [transaction.accountbook_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build update query
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.type !== undefined) {
      fields.push(`type = $${paramIndex}`);
      values.push(updates.type);
      paramIndex++;
    }

    if (updates.amount !== undefined) {
      fields.push(`amount = $${paramIndex}`);
      values.push(updates.amount);
      paramIndex++;
    }

    if (updates.category_id !== undefined) {
      fields.push(`category_id = $${paramIndex}`);
      values.push(updates.category_id);
      paramIndex++;
    }

    if (updates.date !== undefined) {
      fields.push(`date = $${paramIndex}`);
      values.push(updates.date);
      paramIndex++;
    }

    if (updates.memo !== undefined) {
      fields.push(`memo = $${paramIndex}`);
      values.push(updates.memo);
      paramIndex++;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    res.json({
      message: 'Transaction updated successfully',
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Server error updating transaction' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Get transaction
    const transactionResult = await pool.query(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactionResult.rows[0];

    // Check if user has access
    const memberCheck = await pool.query(
      'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2',
      [transaction.accountbook_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('DELETE FROM transactions WHERE id = $1', [id]);

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Server error deleting transaction' });
  }
};

export const getMonthlyStats = async (req: AuthRequest, res: Response) => {
  try {
    const { accountbookId } = req.params;
    const { year, month } = req.query;
    const userId = req.user!.userId;

    // Check if user has access
    const memberCheck = await pool.query(
      'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2',
      [accountbookId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get monthly totals
    const totalsResult = await pool.query(
      `SELECT
         type,
         SUM(amount) as total
       FROM transactions
       WHERE accountbook_id = $1
         AND EXTRACT(YEAR FROM date) = $2
         AND EXTRACT(MONTH FROM date) = $3
       GROUP BY type`,
      [accountbookId, year, month]
    );

    const totals = {
      income: 0,
      expense: 0,
    };

    totalsResult.rows.forEach((row) => {
      totals[row.type as 'income' | 'expense'] = parseFloat(row.total);
    });

    // Get category breakdown
    const categoriesResult = await pool.query(
      `SELECT
         c.id,
         c.name,
         c.type,
         c.color,
         COALESCE(SUM(t.amount), 0) as total
       FROM categories c
       LEFT JOIN transactions t ON c.id = t.category_id
         AND t.accountbook_id = $1
         AND EXTRACT(YEAR FROM t.date) = $2
         AND EXTRACT(MONTH FROM t.date) = $3
       WHERE c.accountbook_id = $1
       GROUP BY c.id, c.name, c.type, c.color
       ORDER BY total DESC`,
      [accountbookId, year, month]
    );

    res.json({
      month: `${year}-${String(month).padStart(2, '0')}`,
      total_income: totals.income,
      total_expense: totals.expense,
      balance: totals.income - totals.expense,
      categories: categoriesResult.rows,
    });
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({ error: 'Server error fetching statistics' });
  }
};
