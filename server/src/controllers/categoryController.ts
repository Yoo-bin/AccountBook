import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { CreateCategoryDTO } from '../types';

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const { accountbookId } = req.params;
    const userId = req.user!.userId;

    // Check if user has access
    const memberCheck = await pool.query(
      'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2',
      [accountbookId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM categories WHERE accountbook_id = $1 ORDER BY type, name',
      [accountbookId]
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { accountbook_id, name, type, color }: CreateCategoryDTO = req.body;
    const userId = req.user!.userId;

    if (!accountbook_id || !name || !type) {
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

    // Check if category already exists
    const existingCategory = await pool.query(
      'SELECT * FROM categories WHERE accountbook_id = $1 AND name = $2 AND type = $3',
      [accountbook_id, name, type]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const result = await pool.query(
      'INSERT INTO categories (accountbook_id, name, type, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [accountbook_id, name, type, color || '#3B82F6']
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: result.rows[0],
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Server error creating category' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const userId = req.user!.userId;

    // Get category
    const categoryResult = await pool.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = categoryResult.rows[0];

    // Check if user has access
    const memberCheck = await pool.query(
      'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2',
      [category.accountbook_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'UPDATE categories SET name = $1, color = $2 WHERE id = $3 RETURNING *',
      [name || category.name, color || category.color, id]
    );

    res.json({
      message: 'Category updated successfully',
      category: result.rows[0],
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Server error updating category' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Get category
    const categoryResult = await pool.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = categoryResult.rows[0];

    // Check if user has access
    const memberCheck = await pool.query(
      'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2',
      [category.accountbook_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if category is being used
    const transactionsResult = await pool.query(
      'SELECT COUNT(*) FROM transactions WHERE category_id = $1',
      [id]
    );

    if (parseInt(transactionsResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete category that is being used in transactions',
      });
    }

    await pool.query('DELETE FROM categories WHERE id = $1', [id]);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Server error deleting category' });
  }
};
