const express = require('express');
const pool = require('../db');

const router = express.Router();

// Get monthly summary
router.get('/summary/:month', async (req, res) => {
  try {
    const { month } = req.params; // format: YYYY-MM
    const userId = req.user.userId;

    const monthDate = new Date(month + '-01');
    if (isNaN(monthDate.getTime())) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    const year = monthDate.getFullYear();
    const monthNum = monthDate.getMonth() + 1;

    // Get user data
    const userResult = await pool.query('SELECT monthly_income FROM users WHERE id = $1', [userId]);
    const monthlyIncome = userResult.rows[0]?.monthly_income || 0;

    // Get transactions
    const transResult = await pool.query(
      `SELECT type, SUM(amount) as total
       FROM transactions
       WHERE user_id = $1
       AND EXTRACT(YEAR FROM transaction_date) = $2
       AND EXTRACT(MONTH FROM transaction_date) = $3
       GROUP BY type`,
      [userId, year, monthNum]
    );

    let totalIncome = 0;
    let totalExpenses = 0;

    transResult.rows.forEach(row => {
      if (row.type === 'income') totalIncome = parseFloat(row.total);
      if (row.type === 'expense') totalExpenses = parseFloat(row.total);
    });

    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(2) : 0;

    res.json({
      month,
      monthlyIncome,
      totalIncome,
      totalExpenses,
      savings,
      savingsRate: parseFloat(savingsRate)
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Get spending by category
router.get('/categories/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const userId = req.user.userId;

    const monthDate = new Date(month + '-01');
    if (isNaN(monthDate.getTime())) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    const year = monthDate.getFullYear();
    const monthNum = monthDate.getMonth() + 1;

    const result = await pool.query(
      `SELECT category, type, COUNT(*) as count, SUM(amount) as total
       FROM transactions
       WHERE user_id = $1
       AND EXTRACT(YEAR FROM transaction_date) = $2
       AND EXTRACT(MONTH FROM transaction_date) = $3
       GROUP BY category, type
       ORDER BY total DESC`,
      [userId, year, monthNum]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get spending trends (last 6 months)
router.get('/trends', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
        TO_CHAR(transaction_date, 'YYYY-MM') as month,
        type,
        SUM(amount) as total
       FROM transactions
       WHERE user_id = $1
       AND transaction_date >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY TO_CHAR(transaction_date, 'YYYY-MM'), type
       ORDER BY month DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Get month-over-month comparison
router.get('/comparison', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
        TO_CHAR(transaction_date, 'YYYY-MM') as month,
        type,
        SUM(amount) as total
       FROM transactions
       WHERE user_id = $1
       AND transaction_date >= CURRENT_DATE - INTERVAL '2 months'
       GROUP BY TO_CHAR(transaction_date, 'YYYY-MM'), type
       ORDER BY month`,
      [userId]
    );

    // Group by month
    const months = {};
    result.rows.forEach(row => {
      if (!months[row.month]) months[row.month] = { income: 0, expense: 0 };
      months[row.month][row.type] = parseFloat(row.total);
    });

    res.json(months);
  } catch (error) {
    console.error('Error fetching comparison:', error);
    res.status(500).json({ error: 'Failed to fetch comparison' });
  }
});

module.exports = router;
