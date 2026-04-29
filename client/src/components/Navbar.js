import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          💰 Budget Analyzer
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">
              Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/transactions" className="nav-link">
              Transactions
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/budget" className="nav-link">
              Budget
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/insights" className="nav-link">
              Insights
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/profile" className="nav-link">
              {user?.firstName || 'Profile'}
            </Link>
          </li>
          <li className="nav-item">
            <button onClick={handleLogout} className="nav-link logout-btn">
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
