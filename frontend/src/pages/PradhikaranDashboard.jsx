import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as usersApi from '../api/users';
import { REGISTRATION_STATUS } from '../constants/roles';
import './Dashboard.css';
import './FormPages.css';

export default function PradhikaranDashboard() {
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // pending, all
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [pendingRes, departmentsRes] = await Promise.all([
        usersApi.getPendingRegistrations(),
        usersApi.getAllDepartments()
      ]);
      
      setPendingRegistrations(pendingRes.data || []);
      setAllDepartments(departmentsRes.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await usersApi.approveRegistration(userId);
      // Refresh data
      loadDashboardData();
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
      loadDashboardData();
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

  if (loading) {
    return <div className="muted">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Pradhikaran Office Dashboard</h1>
          <p className="header-subtitle">Manage department registrations and system administration</p>
        </div>
        <div className="header-actions">
          <Link to="/pradhikaran/analytics" className="btn btn-primary">
            Analytics
          </Link>
          <Link to="/pradhikaran/admin" className="btn btn-ghost">
            Admin Panel
          </Link>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'pending' ? 'tab-active' : ''}
          onClick={() => setActiveTab('pending')}
        >
          Pending Registrations ({pendingRegistrations.length})
        </button>
        <button 
          className={activeTab === 'all' ? 'tab-active' : ''}
          onClick={() => setActiveTab('all')}
        >
          All Departments ({allDepartments.length})
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="dashboard-section">
          <h2>Pending Department Registrations</h2>
          {pendingRegistrations.length === 0 ? (
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
      )}

      {activeTab === 'all' && (
        <div className="dashboard-section">
          <h2>All Departments</h2>
          {allDepartments.length === 0 ? (
            <div className="empty-state">
              <p>No departments registered yet.</p>
            </div>
          ) : (
            <div className="card-list">
              {allDepartments.map((user) => (
                <div key={user._id} className="card">
                  <div className="card-head">
                    <h3>{user.name}</h3>
                    {getStatusBadge(user.registrationStatus)}
                    <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="card-details">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Department:</strong> {user.department || 'Not specified'}</p>
                    <p><strong>Institution:</strong> {user.institution || 'Not specified'}</p>
                    <p><strong>Registered:</strong> {formatDate(user.createdAt)}</p>
                    {user.approvedAt && (
                      <p><strong>Approved:</strong> {formatDate(user.approvedAt)}</p>
                    )}
                  </div>
                  <div className="card-actions">
                    <button
                      className={`btn ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} this account?`)) {
                          usersApi.toggleUserStatus(user._id).then(() => loadDashboardData());
                        }
                      }}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <Link to={`/pradhikaran/users/${user._id}`} className="btn btn-ghost">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}