import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth';
import { ROLES } from '../constants/roles';
import './Auth.css';

export default function DepartmentRegister() {
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    department: '',
    institution: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validate required fields
    if (!form.department?.trim()) {
      setError('Department name is required');
      setLoading(false);
      return;
    }
    
    if (!form.institution?.trim()) {
      setError('Institution name is required');
      setLoading(false);
      return;
    }
    
    try {
      const registrationData = {
        ...form,
        role: ROLES.DEPARTMENTS,
        department: form.department.trim(),
        registrationStatus: 'pending' // New departments start as pending approval
      };
      
      await authApi.register(registrationData);
      
      // Show success message and redirect to login
      alert('Registration submitted successfully! Your account is pending approval from Pradhikaran Office.');
      navigate('/departments/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
            Department Registration
          </div>
        </div>
        <p className="auth-subtitle">Register your department for research collaboration</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <label>
            Full Name *
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label>
            Email *
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password (min 6) *
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label>
            Department Name *
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              required
              placeholder="e.g., Computer Science, Mathematics Department"
            />
          </label>
          <label>
            Institution/Organization *
            <input
              type="text"
              value={form.institution}
              onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))}
              required
              placeholder="e.g., University Name, Research Institute"
            />
          </label>
          <div className="registration-info">
            <p><strong>⚠️ Important:</strong> Your account will be pending approval from Pradhikaran Office. You will receive notification once approved.</p>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Already have an approved account? <Link to="/departments/login">Sign in</Link></p>
          <p>Pradhikaran Office Login? <Link to="/pradhikaran/login">Click here</Link></p>
        </div>
      </div>
    </div>
  );
}