const express = require('express');
const pool = require('../db');
const { generateInsights } = require('../services/insightsEngine');

const router = express.Router();

// Get insights for a month
router.get('/:month', async (req, res) => {
  try {
    const { month } = req.params; // format: YYYY-MM
    const userId = req.user.userId;

    const monthDate = new Date(month + '-01');
    if (isNaN(monthDate.getTime())) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    const result = await pool.query(
      `SELECT * FROM insights 
       WHERE user_id = $1 
       AND EXTRACT(YEAR FROM month) = $2 
       AND EXTRACT(MONTH FROM month) = $3
       ORDER BY severity DESC, created_at DESC`,
      [userId, monthDate.getFullYear(), monthDate.getMonth() + 1]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Get all insights
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM insights WHERE user_id = $1 ORDER BY month DESC, severity DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Regenerate insights for a month
router.post('/:month/regenerate', async (req, res) => {
  try {
    const { month } = req.params;
    const userId = req.user.userId;

    const monthDate = new Date(month + '-01');
    if (isNaN(monthDate.getTime())) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    // Delete old insights
    await pool.query(
      `DELETE FROM insights 
       WHERE user_id = $1 
       AND EXTRACT(YEAR FROM month) = $2 
       AND EXTRACT(MONTH FROM month) = $3`,
      [userId, monthDate.getFullYear(), monthDate.getMonth() + 1]
    );

    // Generate new insights
    const insights = await generateInsights(userId, monthDate, pool);

    res.json({ message: 'Insights regenerated', insights });
  } catch (error) {
    console.error('Error regenerating insights:', error);
    res.status(500).json({ error: 'Failed to regenerate insights' });
  }
});

module.exports = router;
