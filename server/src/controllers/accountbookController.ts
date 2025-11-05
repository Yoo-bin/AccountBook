import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { CreateAccountBookDTO } from '../types';

// Default categories to create for new accountbooks
const DEFAULT_CATEGORIES = [
  { name: '급여', type: 'income', color: '#10B981' },
  { name: '부수입', type: 'income', color: '#34D399' },
  { name: '식비', type: 'expense', color: '#EF4444' },
  { name: '교통', type: 'expense', color: '#F59E0B' },
  { name: '쇼핑', type: 'expense', color: '#8B5CF6' },
  { name: '문화/여가', type: 'expense', color: '#EC4899' },
  { name: '의료/건강', type: 'expense', color: '#06B6D4' },
  { name: '주거/통신', type: 'expense', color: '#6366F1' },
  { name: '기타', type: 'expense', color: '#64748B' },
];

export const createAccountBook = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { name, description }: CreateAccountBookDTO = req.body;
    const userId = req.user!.userId;

    if (!name) {
      return res.status(400).json({ error: 'Account book name is required' });
    }

    await client.query('BEGIN');

    // Create accountbook
    const accountbookResult = await client.query(
      'INSERT INTO accountbooks (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, userId]
    );

    const accountbook = accountbookResult.rows[0];

    // Add creator as owner
    await client.query(
      'INSERT INTO accountbook_members (accountbook_id, user_id, role) VALUES ($1, $2, $3)',
      [accountbook.id, userId, 'owner']
    );

    // Create default categories
    for (const category of DEFAULT_CATEGORIES) {
      await client.query(
        'INSERT INTO categories (accountbook_id, name, type, color) VALUES ($1, $2, $3, $4)',
        [accountbook.id, category.name, category.type, category.color]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Account book created successfully',
      accountbook,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create accountbook error:', error);
    res.status(500).json({ error: 'Server error creating account book' });
  } finally {
    client.release();
  }
};

export const getAccountBooks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      `SELECT a.*, u.name as created_by_name,
              am.role,
              (SELECT COUNT(*) FROM accountbook_members WHERE accountbook_id = a.id) as member_count
       FROM accountbooks a
       JOIN accountbook_members am ON a.id = am.accountbook_id
       JOIN users u ON a.created_by = u.id
       WHERE am.user_id = $1
       ORDER BY a.created_at DESC`,
      [userId]
    );

    res.json({ accountbooks: result.rows });
  } catch (error) {
    console.error('Get accountbooks error:', error);
    res.status(500).json({ error: 'Server error fetching account books' });
  }
};

export const getAccountBook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if user has access
    const memberCheck = await pool.query(
      'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get accountbook details
    const accountbookResult = await pool.query(
      `SELECT a.*, u.name as created_by_name
       FROM accountbooks a
       JOIN users u ON a.created_by = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (accountbookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account book not found' });
    }

    // Get members
    const membersResult = await pool.query(
      `SELECT u.id, u.email, u.name, am.role, am.joined_at
       FROM accountbook_members am
       JOIN users u ON am.user_id = u.id
       WHERE am.accountbook_id = $1
       ORDER BY am.joined_at ASC`,
      [id]
    );

    res.json({
      accountbook: accountbookResult.rows[0],
      members: membersResult.rows,
    });
  } catch (error) {
    console.error('Get accountbook error:', error);
    res.status(500).json({ error: 'Server error fetching account book' });
  }
};

export const updateAccountBook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user!.userId;

    // Check if user is owner
    const memberCheck = await pool.query(
      'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2 AND role = $3',
      [id, userId, 'owner']
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only owner can update account book' });
    }

    const result = await pool.query(
      'UPDATE accountbooks SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description || null, id]
    );

    res.json({
      message: 'Account book updated successfully',
      accountbook: result.rows[0],
    });
  } catch (error) {
    console.error('Update accountbook error:', error);
    res.status(500).json({ error: 'Server error updating account book' });
  }
};

export const deleteAccountBook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if user is owner
    const memberCheck = await pool.query(
      'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2 AND role = $3',
      [id, userId, 'owner']
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only owner can delete account book' });
    }

    await pool.query('DELETE FROM accountbooks WHERE id = $1', [id]);

    res.json({ message: 'Account book deleted successfully' });
  } catch (error) {
    console.error('Delete accountbook error:', error);
    res.status(500).json({ error: 'Server error deleting account book' });
  }
};
