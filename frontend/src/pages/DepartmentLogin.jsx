import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';
import './Auth.css';

export default function DepartmentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Verify this is a Department account
      if (user.role !== ROLES.DEPARTMENTS) {
        setError('This login is only for Department accounts');
        return;
      }
      
      // Check if account is approved
      if (user.registrationStatus !== 'approved') {
        setError('Your account is pending approval. Please contact Pradhikaran Office.');
        return;
      }
      
      navigate('/departments/landing');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Pradhikaran Portal</h1>
          <div className="role-badge department">
            Department Login
          </div>
        </div>
        <p className="auth-subtitle">Sign in to your department account</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Pradhikaran Office Login? <Link to="/pradhikaran/login">Click here</Link></p>
          <p>Need an account? <Link to="/departments/register">Register here</Link></p>
        </div>
      </div>
    </div>
  );
}