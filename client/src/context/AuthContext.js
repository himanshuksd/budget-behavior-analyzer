import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const register = async (email, password, firstName, lastName) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName
      });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      setError(message);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
