import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { sendInvitationEmail } from '../utils/email';
import { InviteUserDTO } from '../types';

export const inviteUser = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { accountbook_id, email }: InviteUserDTO = req.body;
    const userId = req.user!.userId;

    if (!accountbook_id || !email) {
      return res.status(400).json({ error: 'Account book ID and email are required' });
    }

    // Check if user has access to the accountbook
    const memberCheck = await client.query(
      'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2',
      [accountbook_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if invitee is already a member
    const inviteeResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (inviteeResult.rows.length > 0) {
      const inviteeId = inviteeResult.rows[0].id;
      const existingMember = await client.query(
        'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2',
        [accountbook_id, inviteeId]
      );

      if (existingMember.rows.length > 0) {
        return res.status(400).json({ error: 'User is already a member' });
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await client.query(
      'SELECT * FROM invitations WHERE accountbook_id = $1 AND email = $2 AND status = $3',
      [accountbook_id, email, 'pending']
    );

    if (existingInvitation.rows.length > 0) {
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Get accountbook and inviter info
    const accountbookResult = await client.query(
      'SELECT name FROM accountbooks WHERE id = $1',
      [accountbook_id]
    );

    const inviterResult = await client.query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    );

    const accountbookName = accountbookResult.rows[0].name;
    const inviterName = inviterResult.rows[0].name;

    // Create invitation
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await client.query('BEGIN');

    const invitationResult = await client.query(
      `INSERT INTO invitations (accountbook_id, email, token, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [accountbook_id, email, token, userId, expiresAt]
    );

    const invitation = invitationResult.rows[0];

    // Send invitation email
    try {
      await sendInvitationEmail(email, accountbookName, inviterName, token);
    } catch (emailError) {
      await client.query('ROLLBACK');
      console.error('Email sending failed:', emailError);
      return res.status(500).json({ error: 'Failed to send invitation email' });
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expires_at: invitation.expires_at,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Invite user error:', error);
    res.status(500).json({ error: 'Server error sending invitation' });
  } finally {
    client.release();
  }
};

export const acceptInvitation = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { token } = req.params;
    const userId = req.user!.userId;

    // Get invitation
    const invitationResult = await client.query(
      'SELECT * FROM invitations WHERE token = $1',
      [token]
    );

    if (invitationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const invitation = invitationResult.rows[0];

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is no longer valid' });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await client.query(
        'UPDATE invitations SET status = $1 WHERE id = $2',
        ['expired', invitation.id]
      );
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Verify user email matches invitation
    const userResult = await client.query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows[0].email !== invitation.email) {
      return res.status(403).json({
        error: 'This invitation is for a different email address',
      });
    }

    // Check if user is already a member
    const existingMember = await client.query(
      'SELECT * FROM accountbook_members WHERE accountbook_id = $1 AND user_id = $2',
      [invitation.accountbook_id, userId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'You are already a member' });
    }

    await client.query('BEGIN');

    // Add user as member
    await client.query(
      'INSERT INTO accountbook_members (accountbook_id, user_id, role) VALUES ($1, $2, $3)',
      [invitation.accountbook_id, userId, 'member']
    );

    // Update invitation status
    await client.query(
      'UPDATE invitations SET status = $1 WHERE id = $2',
      ['accepted', invitation.id]
    );

    await client.query('COMMIT');

    // Get accountbook info
    const accountbookResult = await client.query(
      'SELECT * FROM accountbooks WHERE id = $1',
      [invitation.accountbook_id]
    );

    res.json({
      message: 'Invitation accepted successfully',
      accountbook: accountbookResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Server error accepting invitation' });
  } finally {
    client.release();
  }
};

export const getInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT i.*, a.name as accountbook_name, u.name as invited_by_name
       FROM invitations i
       JOIN accountbooks a ON i.accountbook_id = a.id
       LEFT JOIN users u ON i.invited_by = u.id
       WHERE i.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const invitation = result.rows[0];

    // Check if expired
    if (new Date(invitation.expires_at) < new Date() && invitation.status === 'pending') {
      await pool.query(
        'UPDATE invitations SET status = $1 WHERE id = $2',
        ['expired', invitation.id]
      );
      invitation.status = 'expired';
    }

    res.json({ invitation });
  } catch (error) {
    console.error('Get invitation error:', error);
    res.status(500).json({ error: 'Server error fetching invitation' });
  }
};

export const getPendingInvitations = async (req: AuthRequest, res: Response) => {
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
      `SELECT i.*, u.name as invited_by_name
       FROM invitations i
       LEFT JOIN users u ON i.invited_by = u.id
       WHERE i.accountbook_id = $1 AND i.status = $2
       ORDER BY i.created_at DESC`,
      [accountbookId, 'pending']
    );

    res.json({ invitations: result.rows });
  } catch (error) {
    console.error('Get pending invitations error:', error);
    res.status(500).json({ error: 'Server error fetching invitations' });
  }
};
