import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '../api/auth';
import * as usersApi from '../api/users';
import { ROLES } from '../constants/roles';
import './Dashboard.css';
import './FormPages.css';

export default function AdminPanel() {
  const [adminUsers, setAdminUsers] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
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
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      // Load admin users
      // This would require a special admin endpoint to get all Pradhikaran Office users
      // For now, we'll mock this functionality
      console.log('Loading admin users - this needs backend implementation');
      setAdminUsers([]);
      
      // Load pending registrations
      try {
        const pendingRes = await usersApi.getPendingRegistrations();
        setPendingRegistrations(pendingRes.data || []);
      } catch (error) {
        console.error('Failed to load pending registrations:', error);
        setPendingRegistrations([]);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
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
      loadAdminData();
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

  const handleApprove = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await usersApi.approveRegistration(userId);
      // Refresh data
      loadAdminData();
      alert('Registration approved successfully!');
    } catch (error) {
      alert('Failed to approve registration: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleReject = async (userId) => {
    const reason = window.prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await usersApi.rejectRegistration(userId, reason || undefined);
      // Refresh data
      loadAdminData();
      alert('Registration rejected successfully!');
    } catch (error) {
      alert('Failed to reject registration: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      // Fallback to simple formatting
      return new Date(date).toString();
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { label: 'Pending', color: '#fd7e14', bg: '#fff3cd' },
      'approved': { label: 'Approved', color: '#198754', bg: '#d1e7dd' },
      'rejected': { label: 'Rejected', color: '#dc3545', bg: '#f8d7da' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span 
        className="status-badge"
        style={{
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.color}`,
          padding: '0.25rem 0.5rem',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: '500'
        }}
      >
        {config.label}
      </span>
    );
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
        {/* Pending Registrations Section */}
        <div className="admin-card">
          <h2>Pending Department Registrations</h2>
          <p>Review and approve department registration requests.</p>
          
          {loading ? (
            <div className="muted">Loading pending registrations...</div>
          ) : pendingRegistrations.length === 0 ? (
            <div className="empty-state">
              <p>No pending registrations at this time.</p>
            </div>
          ) : (
            <div className="card-list">
              {pendingRegistrations.map((user) => (
                <div key={user._id} className="card">
                  <div className="card-head">
                    <h3>{user.name}</h3>
                    {getStatusBadge(user.registrationStatus)}
                  </div>
                  <div className="card-details">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Department:</strong> {user.department || 'Not specified'}</p>
                    <p><strong>Institution:</strong> {user.institution || 'Not specified'}</p>
                    <p><strong>Registered:</strong> {formatDate(user.createdAt)}</p>
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(user._id)}
                      disabled={actionLoading[user._id]}
                    >
                      {actionLoading[user._id] ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(user._id)}
                      disabled={actionLoading[user._id]}
                    >
                      {actionLoading[user._id] ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
              <span>{pendingRegistrations.length}</span>
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