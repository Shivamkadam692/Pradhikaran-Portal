import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '../api/auth';
import * as usersApi from '../api/users';
import { ROLES } from '../constants/roles';
import './Dashboard.css';
import './FormPages.css';

export default function AdminPanel() {
  const [adminUsers, setAdminUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    department: 'Pradhikaran Office'
  });

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      // This would require a special admin endpoint to get all Pradhikaran Office users
      // For now, we'll mock this functionality
      console.log('Loading admin users - this needs backend implementation');
      setAdminUsers([]);
    } catch (error) {
      console.error('Failed to load admin users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    if (!form.email || !form.password || !form.name) {
      alert('Please fill all required fields');
      return;
    }
    
    setActionLoading({ create: true });
    
    try {
      const adminData = {
        ...form,
        role: ROLES.PRADHIKARAN_OFFICE,
        registrationStatus: 'approved'
      };
      
      await authApi.register(adminData);
      alert('Admin account created successfully!');
      setShowCreateForm(false);
      setForm({ email: '', password: '', name: '', department: 'Pradhikaran Office' });
      loadAdminUsers();
    } catch (error) {
      alert('Failed to create admin account: ' + error.message);
    } finally {
      setActionLoading({ create: false });
    }
  };

  const handleDeleteAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this admin account? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading({ [userId]: true });
    
    try {
      // This would require backend implementation
      console.log('Delete admin user - this needs backend implementation');
      alert('Delete functionality needs to be implemented on backend');
    } catch (error) {
      alert('Failed to delete admin account: ' + error.message);
    } finally {
      setActionLoading({ [userId]: false });
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>System Administration</h1>
          <p className="header-subtitle">Manage Pradhikaran Office accounts and system settings</p>
        </div>
        <div className="header-actions">
          <Link to="/pradhikaran/dashboard" className="btn btn-ghost">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="admin-sections">
        <div className="admin-card">
          <h2>Pradhikaran Office Accounts</h2>
          <p>Manage administrative accounts with full system access.</p>
          
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create New Admin'}
          </button>
          
          {showCreateForm && (
            <div className="admin-form-container">
              <h3>Create New Admin Account</h3>
              <form onSubmit={handleCreateAdmin} className="auth-form">
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
                  />
                </label>
                <label>
                  Department
                  <input
                    type="text"
                    value={form.department}
                    readOnly
                    className="form-input-disabled"
                  />
                </label>
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={actionLoading.create}
                  >
                    {actionLoading.create ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="admin-card">
          <h2>System Information</h2>
          <div className="system-info">
            <div className="info-item">
              <strong>Total Departments:</strong> 
              <span>View in main dashboard</span>
            </div>
            <div className="info-item">
              <strong>Pending Registrations:</strong> 
              <span>View in main dashboard</span>
            </div>
            <div className="info-item">
              <strong>System Status:</strong> 
              <span className="status-badge success">Operational</span>
            </div>
            <div className="info-item">
              <strong>Last Backup:</strong> 
              <span>Not configured</span>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h2>Security Settings</h2>
          <div className="security-settings">
            <div className="setting-item">
              <label>
                <input type="checkbox" defaultChecked />
                Enable audit logging
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" />
                Require two-factor authentication (Not implemented)
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input type="checkbox" defaultChecked />
                Enable real-time notifications
              </label>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h2>Maintenance</h2>
          <div className="maintenance-actions">
            <button className="btn btn-warning" disabled>
              Backup Database (Not implemented)
            </button>
            <button className="btn btn-warning" disabled>
              Clear Audit Logs (Not implemented)
            </button>
            <button className="btn btn-danger" disabled>
              Reset System (Not implemented)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}