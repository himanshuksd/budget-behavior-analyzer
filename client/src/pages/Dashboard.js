import React, { useState, useEffect } from 'react';
import api from '../api';
import './Dashboard.css';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().split('T')[0].slice(0, 7)
  );

  useEffect(() => {
    fetchSummary();
  }, [currentMonth]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/analytics/summary/${currentMonth}`);
      setSummary(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch summary');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <input
          type="month"
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className="month-input"
        />
      </div>

      {summary && (
        <div className="grid">
          <div className="stat-card">
            <div className="stat-label">Total Income</div>
            <div className="stat-value income">${summary.totalIncome?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value expense">${summary.totalExpenses?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Savings</div>
            <div className="stat-value savings">${summary.savings?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Savings Rate</div>
            <div className="stat-value rate">{summary.savingsRate?.toFixed(2) || '0'}%</div>
          </div>
        </div>
      )}

      <div className="card mt-20">
        <div className="card-header">Quick Stats</div>
        <div className="stats-table">
          <div className="stat-row">
            <span>Monthly Income Set:</span>
            <span className="stat-val">${summary?.monthlyIncome?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="stat-row">
            <span>Remaining Budget:</span>
            <span className="stat-val">${(summary?.monthlyIncome - summary?.totalExpenses)?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="stat-row">
            <span>Budget Utilization:</span>
            <span className="stat-val">
              {summary?.monthlyIncome ? 
                ((summary.totalExpenses / summary.monthlyIncome) * 100).toFixed(1) : '0'}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
