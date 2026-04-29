const pool = require('../db');

/**
 * Generates insights based on spending patterns
 */
async function generateInsights(userId, monthDate, dbPool = pool) {
  try {
    const year = monthDate.getFullYear();
    const monthNum = monthDate.getMonth() + 1;
    const insights = [];

    // Get user's monthly income
    const userResult = await dbPool.query(
      'SELECT monthly_income FROM users WHERE id = $1',
      [userId]
    );
    const monthlyIncome = userResult.rows[0]?.monthly_income || 0;

    // 1. OVERSPENDING DETECTION
    const budgetResult = await dbPool.query(
      `SELECT b.category, b.allocated_amount,
              COALESCE(SUM(t.amount), 0) as spent
       FROM budgets b
       LEFT JOIN transactions t ON b.category = t.category 
                                  AND t.user_id = b.user_id
                                  AND t.type = 'expense'
                                  AND EXTRACT(YEAR FROM t.transaction_date) = $2
                                  AND EXTRACT(MONTH FROM t.transaction_date) = $3
       WHERE b.user_id = $1
       AND EXTRACT(YEAR FROM b.month) = $2
       AND EXTRACT(MONTH FROM b.month) = $3
       GROUP BY b.id, b.category, b.allocated_amount`,
      [userId, year, monthNum]
    );

    for (const budget of budgetResult.rows) {
      const variance = ((budget.spent - budget.allocated_amount) / budget.allocated_amount * 100).toFixed(2);
      if (budget.spent > budget.allocated_amount) {
        let severity = 'medium';
        if (variance > 20) severity = 'high';
        if (variance > 40) severity = 'high';

        const insight = {
          userId,
          type: 'overspending',
          category: budget.category,
          severity,
          message: `Overspent in ${budget.category} by ${variance}% (Spent: $${budget.spent}, Budget: $${budget.allocated_amount})`,
          metricValue: parseFloat(variance),
          month: monthDate
        };
        insights.push(insight);
      }
    }

    // 2. TREND ANALYSIS (compare with previous month)
    const previousMonth = new Date(monthDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const currentExpenses = await dbPool.query(
      `SELECT SUM(amount) as total FROM transactions
       WHERE user_id = $1 AND type = 'expense'
       AND EXTRACT(YEAR FROM transaction_date) = $2
       AND EXTRACT(MONTH FROM transaction_date) = $3`,
      [userId, year, monthNum]
    );

    const previousExpenses = await dbPool.query(
      `SELECT SUM(amount) as total FROM transactions
       WHERE user_id = $1 AND type = 'expense'
       AND EXTRACT(YEAR FROM transaction_date) = $2
       AND EXTRACT(MONTH FROM transaction_date) = $3`,
      [userId, previousMonth.getFullYear(), previousMonth.getMonth() + 1]
    );

    const currentTotal = parseFloat(currentExpenses.rows[0].total) || 0;
    const previousTotal = parseFloat(previousExpenses.rows[0].total) || 0;

    if (previousTotal > 0) {
      const trendChange = ((currentTotal - previousTotal) / previousTotal * 100).toFixed(2);
      if (Math.abs(trendChange) > 15) {
        const severity = Math.abs(trendChange) > 30 ? 'high' : 'medium';
        const direction = trendChange > 0 ? 'increased' : 'decreased';

        insights.push({
          userId,
          type: 'trend_analysis',
          category: null,
          severity,
          message: `Spending ${direction} by ${Math.abs(trendChange)}% compared to last month`,
          metricValue: parseFloat(trendChange),
          month: monthDate
        });
      }
    }

    // 3. SPENDING VELOCITY (transaction frequency)
    const velocityResult = await dbPool.query(
      `SELECT COUNT(*) as transaction_count,
              COUNT(DISTINCT DATE(transaction_date)) as days_active
       FROM transactions
       WHERE user_id = $1
       AND EXTRACT(YEAR FROM transaction_date) = $2
       AND EXTRACT(MONTH FROM transaction_date) = $3`,
      [userId, year, monthNum]
    );

    const transactionCount = parseInt(velocityResult.rows[0].transaction_count);
    const daysActive = parseInt(velocityResult.rows[0].days_active);
    const avgPerDay = daysActive > 0 ? (transactionCount / daysActive).toFixed(2) : 0;

    if (avgPerDay > 2) {
      insights.push({
        userId,
        type: 'spending_velocity',
        category: null,
        severity: avgPerDay > 3 ? 'high' : 'medium',
        message: `High transaction frequency: ${avgPerDay} transactions per active day. Review frequent small purchases.`,
        metricValue: parseFloat(avgPerDay),
        month: monthDate
      });
    }

    // 4. BUDGET COMPLIANCE
    const complianceResult = await dbPool.query(
      `SELECT b.category, b.allocated_amount,
              COALESCE(SUM(t.amount), 0) as spent
       FROM budgets b
       LEFT JOIN transactions t ON b.category = t.category
                                  AND t.user_id = b.user_id
                                  AND t.type = 'expense'
                                  AND EXTRACT(YEAR FROM t.transaction_date) = $2
                                  AND EXTRACT(MONTH FROM t.transaction_date) = $3
       WHERE b.user_id = $1
       AND EXTRACT(YEAR FROM b.month) = $2
       AND EXTRACT(MONTH FROM b.month) = $3
       GROUP BY b.id, b.category, b.allocated_amount`,
      [userId, year, monthNum]
    );

    for (const budget of complianceResult.rows) {
      const usagePercent = ((budget.spent / budget.allocated_amount) * 100).toFixed(2);
      if (usagePercent < 20 && budget.allocated_amount > 0) {
        insights.push({
          userId,
          type: 'budget_opportunity',
          category: budget.category,
          severity: 'low',
          message: `Opportunity: Only using ${usagePercent}% of allocated budget in ${budget.category}`,
          metricValue: parseFloat(usagePercent),
          month: monthDate
        });
      }
    }

    // 5. INCOME-TO-EXPENSE RATIO
    const incomeResult = await dbPool.query(
      `SELECT SUM(amount) as total FROM transactions
       WHERE user_id = $1 AND type = 'income'
       AND EXTRACT(YEAR FROM transaction_date) = $2
       AND EXTRACT(MONTH FROM transaction_date) = $3`,
      [userId, year, monthNum]
    );

    const totalIncome = parseFloat(incomeResult.rows[0].total) || monthlyIncome || 0;
    const totalExpenses = currentTotal;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2) : -100;

    if (savingsRate < 10) {
      const severity = savingsRate < 0 ? 'high' : 'medium';
      insights.push({
        userId,
        type: 'savings_ratio',
        category: null,
        severity,
        message: `Low savings rate: ${savingsRate}% of income. Consider increasing savings goals.`,
        metricValue: parseFloat(savingsRate),
        month: monthDate
      });
    }

    // Store insights in database
    for (const insight of insights) {
      await dbPool.query(
        `INSERT INTO insights (user_id, type, category, severity, message, metric_value, month)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [insight.userId, insight.type, insight.category, insight.severity, insight.message, insight.metricValue, insight.month]
      );
    }

    return insights;
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
}

module.exports = { generateInsights };
