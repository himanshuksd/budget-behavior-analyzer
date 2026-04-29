require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budget');
const insightsRoutes = require('./routes/insights');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/user');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/budget', authMiddleware, budgetRoutes);
app.use('/api/insights', authMiddleware, insightsRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/user', authMiddleware, userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
