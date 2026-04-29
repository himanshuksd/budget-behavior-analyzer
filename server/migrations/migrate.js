const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await pool.query(statement);
      }
    }
    
    console.log('✅ Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
