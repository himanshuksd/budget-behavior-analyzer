const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../db');

const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT id, email, first_name, last_name, monthly_income, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      monthlyIncome: user.monthly_income,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile',
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('monthlyIncome').optional().isDecimal({ min: 0 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.userId;
      const { firstName, lastName, monthlyIncome } = req.body;

      const result = await pool.query(
        `UPDATE users 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             monthly_income = COALESCE($3, monthly_income),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING id, email, first_name, last_name, monthly_income`,
        [firstName || null, lastName || null, monthlyIncome || null, userId]
      );

      const user = result.rows[0];
      res.json({
        message: 'Profile updated',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          monthlyIncome: user.monthly_income
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Change password
router.put('/password',
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      // Get user
      const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, userId]
      );

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

module.exports = router;
