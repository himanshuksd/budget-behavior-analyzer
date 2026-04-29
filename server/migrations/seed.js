const pool = require('../db');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('Seeding database with demo data...');

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, monthly_income)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['demo@example.com', hashedPassword, 'Demo', 'User', 5000]
    );

    if (userResult.rows.length === 0) {
      console.log('Demo user already exists');
      process.exit(0);
    }

    const userId = userResult.rows[0].id;
    console.log(`Created demo user with ID: ${userId}`);

    // Get current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Create budgets
    const budgets = [
      { category: 'Food', amount: 500 },
      { category: 'Transportation', amount: 300 },
      { category: 'Entertainment', amount: 200 },
      { category: 'Utilities', amount: 200 },
      { category: 'Shopping', amount: 300 },
      { category: 'Health', amount: 150 }
    ];

    for (const budget of budgets) {
      await pool.query(
        `INSERT INTO budgets (user_id, category, allocated_amount, month)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, category, month) DO NOTHING`,
        [userId, budget.category, budget.amount, currentMonth + '-01']
      );
    }
    console.log('Created budgets');

    // Create sample transactions
    const today = now.toISOString().split('T')[0];
    const daysAgo = (n) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toISOString().split('T')[0];
    };

    const transactions = [
      { type: 'income', category: 'Salary', amount: 5000, date: daysAgo(25), desc: 'Monthly salary' },
      { type: 'expense', category: 'Food', amount: 45.50, date: daysAgo(20), desc: 'Grocery shopping' },
      { type: 'expense', category: 'Food', amount: 30, date: daysAgo(18), desc: 'Restaurant' },
      { type: 'expense', category: 'Transportation', amount: 50, date: daysAgo(15), desc: 'Gas' },
      { type: 'expense', category: 'Entertainment', amount: 25, date: daysAgo(12), desc: 'Movie tickets' },
      { type: 'expense', category: 'Utilities', amount: 120, date: daysAgo(10), desc: 'Electricity bill' },
      { type: 'expense', category: 'Shopping', amount: 80, date: daysAgo(8), desc: 'Clothing' },
      { type: 'expense', category: 'Food', amount: 35.75, date: daysAgo(5), desc: 'Dinner' },
      { type: 'expense', category: 'Health', amount: 40, date: daysAgo(3), desc: 'Gym membership' },
      { type: 'expense', category: 'Transportation', amount: 15, date: today, desc: 'Parking' }
    ];

    for (const trans of transactions) {
      await pool.query(
        `INSERT INTO transactions (user_id, type, category, amount, transaction_date, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, trans.type, trans.category, trans.amount, trans.date, trans.desc]
      );
    }
    console.log('Created sample transactions');

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
