const express = require('express');
const { body, validationResult, param } = require('express-validator');
const pool = require('../db');

const router = express.Router();

// Get budget for specific month
router.get('/:month', async (req, res) => {
  try {
    const { month } = req.params; // format: YYYY-MM
    const userId = req.user.userId;

    const monthDate = new Date(month + '-01');
    if (isNaN(monthDate.getTime())) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    const result = await pool.query(
      `SELECT * FROM budgets 
       WHERE user_id = $1 
       AND EXTRACT(YEAR FROM month) = $2 
       AND EXTRACT(MONTH FROM month) = $3
       ORDER BY category`,
      [userId, monthDate.getFullYear(), monthDate.getMonth() + 1]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// Get all budgets
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM budgets WHERE user_id = $1 ORDER BY month DESC, category',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Set/update budget for month
router.post('/:month',
  param('month').matches(/^\d{4}-\d{2}$/),
  body('budgets').isArray().notEmpty(),
  body('budgets.*.category').notEmpty().trim(),
  body('budgets.*.amount').isDecimal({ min: 0 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { month } = req.params;
      const { budgets } = req.body;
      const userId = req.user.userId;

      const monthDate = new Date(month + '-01');

      // Delete existing budgets for this month
      await pool.query(
        `DELETE FROM budgets 
         WHERE user_id = $1 
         AND EXTRACT(YEAR FROM month) = $2 
         AND EXTRACT(MONTH FROM month) = $3`,
        [userId, monthDate.getFullYear(), monthDate.getMonth() + 1]
      );

      // Insert new budgets
      const values = [];
      const placeholders = [];
      let index = 1;

      for (const budget of budgets) {
        values.push(userId, budget.category, budget.amount, month + '-01');
        placeholders.push(
          `($${index}, $${index + 1}, $${index + 2}, $${index + 3})`
        );
        index += 4;
      }

      if (placeholders.length === 0) {
        return res.status(400).json({ error: 'No budgets provided' });
      }

      const query = `INSERT INTO budgets (user_id, category, allocated_amount, month) 
                     VALUES ${placeholders.join(', ')} 
                     RETURNING *`;

      const result = await pool.query(query, values);
      res.status(201).json(result.rows);
    } catch (error) {
      console.error('Error setting budget:', error);
      res.status(500).json({ error: 'Failed to set budget' });
    }
  }
);

module.exports = router;
