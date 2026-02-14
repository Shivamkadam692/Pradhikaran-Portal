import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as usersApi from '../api/users';
import './Dashboard.css';

export default function DepartmentManagementDashboard() {
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState('pending'); // pending or all

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
    setActionLoading(prev => ({ ...prev, [userId]: 'approve' }));
    try {
      await usersApi.approveRegistration(userId);
      await loadData(); // Refresh data
    } catch (error) {
      alert('Failed to approve registration: ' + error.message);
    } finally {
      setActionLoading(prev => {
        const newLoading = { ...prev };
        delete newLoading[userId];
        return newLoading;
      });
    }
  };

  const handleReject = async (userId) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    
    setActionLoading(prev => ({ ...prev, [userId]: 'reject' }));
    try {
      await usersApi.rejectRegistration(userId, reason);
      await loadData(); // Refresh data
    } catch (error) {
      alert('Failed to reject registration: ' + error.message);
    } finally {
      setActionLoading(prev => {
        const newLoading = { ...prev };
        delete newLoading[userId];
        return newLoading;
      });
    }
  };

  const toggleUserStatus = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: 'toggle' }));
    try {
      await usersApi.toggleUserStatus(userId);
      await loadData(); // Refresh data
    } catch (error) {
      alert('Failed to toggle user status: ' + error.message);
    } finally {
      setActionLoading(prev => {
        const newLoading = { ...prev };
        delete newLoading[userId];
        return newLoading;
      });
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return new Date(date).toString();
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'status-badge status-pending',
      approved: 'status-badge status-approved',
      rejected: 'status-badge status-rejected'
    };
    const statusText = {
      pending: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected'
    };
    return <span className={statusStyles[status] || 'status-badge'}>{statusText[status] || status}</span>;
  };

  if (loading) {
    return <div className="muted">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Department Management</h1>
          <p className="header-subtitle">Manage department registrations and accounts</p>
        </div>
        <div className="header-actions">
          <Link to="/pradhikaran/admin" className="btn btn-ghost">
            System Admin
          </Link>
        </div>
      </div>

      {/* Top section - All Departments Overview */}
      <div className="section">
        <div className="section-header">
          <h2>All Departments</h2>
          <div className="section-actions">
            <span className="item-count">{allDepartments.length} departments</span>
          </div>
        </div>
        
        {allDepartments.length === 0 ? (
          <div className="empty-state">
            <p>No departments registered yet</p>
          </div>
        ) : (
          <div className="card-grid">
            {allDepartments.slice(0, 5).map((user) => (
              <div key={user._id} className="card compact">
                <div className="card-head">
                  <h3 className="card-title truncate">{user.name}</h3>
                  <div className="status-group">
                    {getStatusBadge(user.registrationStatus)}
                    <span className={`status-badge ${user.isActive === false ? 'status-inactive' : 'status-active'}`}>
                      {user.isActive === false ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                </div>
                <div className="card-content compact">
                  <p className="truncate"><strong>Dept:</strong> {user.department}</p>
                  <p className="truncate"><strong>Inst:</strong> {user.institution || 'N/A'}</p>
                  <p><strong>Since:</strong> {formatDate(user.createdAt).split(' ')[0]}</p>
                </div>
              </div>
            ))}
            {allDepartments.length > 5 && (
              <div className="card compact view-all-card">
                <div className="card-content center">
                  <Link to="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('all');
                    }}
                    className="view-all-link">
                    View all {allDepartments.length} departments
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{pendingRegistrations.length}</h3>
          <p>Pending Requests</p>
        </div>
        <div className="stat-card">
          <h3>{allDepartments.length}</h3>
          <p>Total Departments</p>
        </div>
        <div className="stat-card">
          <h3>{allDepartments.filter(d => d.isActive !== false).length}</h3>
          <p>Active Departments</p>
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

      {activeTab === 'pending' ? (
        <div className="section">
          <h2>Pending Department Registrations</h2>
          {pendingRegistrations.length === 0 ? (
            <div className="empty-state">
              <p>No pending registration requests</p>
            </div>
          ) : (
            <div className="card-list">
              {pendingRegistrations.map((user) => (
                <div key={user._id} className="card">
                  <div className="card-head">
                    <h3 className="card-title">{user.name}</h3>
                    {getStatusBadge(user.registrationStatus)}
                  </div>
                  <div className="card-content">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Department:</strong> {user.department}</p>
                    <p><strong>Institution:</strong> {user.institution || 'N/A'}</p>
                    <p><strong>Registered:</strong> {formatDate(user.createdAt)}</p>
                  </div>
                  <div className="card-actions">
                    <button 
                      className="btn btn-success"
                      onClick={() => handleApprove(user._id)}
                      disabled={!!actionLoading[user._id]}
                    >
                      {actionLoading[user._id] === 'approve' ? 'Approving...' : 'Approve'}
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleReject(user._id)}
                      disabled={!!actionLoading[user._id]}
                    >
                      {actionLoading[user._id] === 'reject' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="section">
          <h2>All Departments</h2>
          <div className="card-list">
            {allDepartments.map((user) => (
              <div key={user._id} className="card">
                <div className="card-head">
                  <h3 className="card-title">{user.name}</h3>
                  <div>
                    {getStatusBadge(user.registrationStatus)}
                    <span className={`status-badge ${user.isActive === false ? 'status-inactive' : 'status-active'}`}>
                      {user.isActive === false ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                </div>
                <div className="card-content">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Department:</strong> {user.department}</p>
                  <p><strong>Institution:</strong> {user.institution || 'N/A'}</p>
                  <p><strong>Registered:</strong> {formatDate(user.createdAt)}</p>
                  {user.approvedAt && (
                    <p><strong>Approved:</strong> {formatDate(user.approvedAt)} by {user.approvedBy?.name || 'System'}</p>
                  )}
                </div>
                <div className="card-actions">
                  <button 
                    className={`btn ${user.isActive === false ? 'btn-success' : 'btn-warning'}`}
                    onClick={() => toggleUserStatus(user._id)}
                    disabled={!!actionLoading[user._id]}
                  >
                    {actionLoading[user._id] === 'toggle' 
                      ? (user.isActive === false ? 'Activating...' : 'Deactivating...') 
                      : (user.isActive === false ? 'Activate' : 'Deactivate')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}