import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as usersApi from '../api/users';
import * as questionsApi from '../api/questions';
import './Dashboard.css';
import './FormPages.css';

export default function DepartmentListView() {
  const { departmentId } = useParams();
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departmentQuestions, setDepartmentQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (departmentId) {
      loadDepartmentDetails(departmentId);
      loadDepartmentQuestions(departmentId);
    }
  }, [departmentId]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAllDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentDetails = async (deptId) => {
    try {
      const dept = departments.find(d => d._id === deptId);
      setSelectedDepartment(dept || null);
    } catch (error) {
      console.error('Error loading department details:', error);
    }
  };

  const loadDepartmentQuestions = async (deptId) => {
    try {
      setQuestionsLoading(true);
      // Get all questions and filter by target department
      const response = await questionsApi.listAll();
      const deptQuestions = response.data.filter(q => q.targetDepartment === selectedDepartment.department);
      setDepartmentQuestions(deptQuestions);
    } catch (error) {
      console.error('Error loading department questions:', error);
      setDepartmentQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return <div className="muted">Loading departments...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Departments</h1>
        <p className="header-subtitle">View and manage departments</p>
      </div>

      <div className="departments-layout">
        {/* Departments List */}
        <aside className="departments-sidebar">
          <div className="sidebar-header">
            <h2>All Departments ({departments.length})</h2>
          </div>
          <div className="departments-list">
            {departments.length === 0 ? (
              <div className="empty-state">
                <p>No departments registered yet</p>
              </div>
            ) : (
              departments.map((dept) => (
                <div 
                  key={dept._id} 
                  className={`department-card ${selectedDepartment?._id === dept._id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedDepartment(dept);
                    // In a real app, we'd navigate to the department detail view
                  }}
                >
                  <div className="department-info">
                    <h3 className="department-name">{dept.name}</h3>
                    <p className="department-dept">{dept.department}</p>
                    {dept.institution && <p className="department-inst">{dept.institution}</p>}
                  </div>
                  <div className="department-meta">
                    <span className={`status-badge ${dept.isActive ? 'status-active' : 'status-inactive'}`}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="department-date">
                      {formatDate(dept.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Department Details and Actions */}
        <div className="departments-main">
          {selectedDepartment ? (
            <div className="department-detail">
              <div className="department-header">
                <h2>{selectedDepartment.name}</h2>
                <div className="department-actions">
                  <Link 
                    to={`/senior/questions/new?targetDepartment=${encodeURIComponent(selectedDepartment.department)}&departmentName=${encodeURIComponent(selectedDepartment.name)}`} 
                    className="btn btn-primary"
                  >
                    Create Question for Department
                  </Link>
                </div>
              </div>

              <div className="department-info-grid">
                <div className="info-item">
                  <label>Full Name</label>
                  <span>{selectedDepartment.name}</span>
                </div>
                <div className="info-item">
                  <label>Department</label>
                  <span>{selectedDepartment.department}</span>
                </div>
                <div className="info-item">
                  <label>Institution</label>
                  <span>{selectedDepartment.institution || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <span>{selectedDepartment.email}</span>
                </div>
                <div className="info-item">
                  <label>Status</label>
                  <span className={`status-badge ${selectedDepartment.isActive ? 'status-active' : 'status-inactive'}`}>
                    {selectedDepartment.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="info-item">
                  <label>Registration Status</label>
                  <span className={`status-badge ${
                    selectedDepartment.registrationStatus === 'approved' ? 'status-approved' :
                    selectedDepartment.registrationStatus === 'pending' ? 'status-pending' :
                    'status-rejected'
                  }`}>
                    {selectedDepartment.registrationStatus}
                  </span>
                </div>
                <div className="info-item">
                  <label>Member Since</label>
                  <span>{formatDate(selectedDepartment.createdAt)}</span>
                </div>
                {selectedDepartment.approvedAt && (
                  <div className="info-item">
                    <label>Approved At</label>
                    <span>{formatDate(selectedDepartment.approvedAt)}</span>
                  </div>
                )}
              </div>

              {/* Department Questions */}
              <div className="section">
                <div className="section-header">
                  <h3>Questions for this Department</h3>
                  <div className="section-actions">
                    <span className="item-count">{departmentQuestions.length} questions</span>
                  </div>
                </div>
                
                {questionsLoading ? (
                  <div className="muted">Loading questions...</div>
                ) : departmentQuestions.length === 0 ? (
                  <div className="empty-state">
                    <p>No questions assigned to this department yet.</p>
                  </div>
                ) : (
                  <div className="card-list">
                    {departmentQuestions.map((question) => (
                      <div key={question._id} className="card">
                        <div className="card-head">
                          <h3 className="card-title">{question.title}</h3>
                          <span className={`status status-${question.status}`}>{question.status}</span>
                        </div>
                        <div className="card-content">
                          <p className="card-desc">{question.description.substring(0, 150)}{question.description.length > 150 ? '...' : ''}</p>
                          <div className="card-meta">
                            <span>Deadline: {formatDate(question.submissionDeadline)}</span>
                            <span>Answers: {question.answerCount || 0}</span>
                          </div>
                        </div>
                        <div className="card-actions">
                          <Link to={`/senior/questions/${question._id}`} className="btn btn-ghost">
                            View Details
                          </Link>
                          <Link to={`/senior/questions/${question._id}/review`} className="btn btn-primary">
                            Review Answers
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <h3>Select a department to view details</h3>
              <p>Click on a department from the list to see its details and related questions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}