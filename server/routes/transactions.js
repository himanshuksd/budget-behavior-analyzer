const express = require('express');
const { body, validationResult, param } = require('express-validator');
const pool = require('../db');

const router = express.Router();

// Get all transactions (paginated)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;

    let query = 'SELECT * FROM transactions WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND transaction_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND transaction_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ' ORDER BY transaction_date DESC LIMIT $' + paramIndex + ' OFFSET $' + (paramIndex + 1);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM transactions WHERE user_id = $1',
      [userId]
    );

    res.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get single transaction
router.get('/:id',
  param('id').isInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userId = req.user.userId;

      const result = await pool.query(
        'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ error: 'Failed to fetch transaction' });
    }
  }
);

// Create transaction
router.post('/',
  body('type').isIn(['income', 'expense']),
  body('category').notEmpty().trim(),
  body('amount').isDecimal({ min: 0.01 }),
  body('transactionDate').isISO8601(),
  body('description').optional().trim(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, category, amount, transactionDate, description } = req.body;
      const userId = req.user.userId;

      const result = await pool.query(
        'INSERT INTO transactions (user_id, type, category, amount, transaction_date, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [userId, type, category, amount, transactionDate, description || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  }
);

// Update transaction
router.put('/:id',
  param('id').isInt(),
  body('type').optional().isIn(['income', 'expense']),
  body('category').optional().notEmpty().trim(),
  body('amount').optional().isDecimal({ min: 0.01 }),
  body('transactionDate').optional().isISO8601(),
  body('description').optional().trim(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userId = req.user.userId;
      const { type, category, amount, transactionDate, description } = req.body;

      // Check if transaction exists
      const existingResult = await pool.query(
        'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (existingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const transaction = existingResult.rows[0];
      const updateValues = {
        type: type || transaction.type,
        category: category || transaction.category,
        amount: amount || transaction.amount,
        transactionDate: transactionDate || transaction.transaction_date,
        description: description !== undefined ? description : transaction.description
      };

      const result = await pool.query(
        'UPDATE transactions SET type = $1, category = $2, amount = $3, transaction_date = $4, description = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
        [updateValues.type, updateValues.category, updateValues.amount, updateValues.transactionDate, updateValues.description, id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ error: 'Failed to update transaction' });
    }
  }
);

// Delete transaction
router.delete('/:id',
  param('id').isInt(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userId = req.user.userId;

      const result = await pool.query(
        'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({ message: 'Transaction deleted', transaction: result.rows[0] });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  }
);

module.exports = router;
