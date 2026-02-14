import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as questionsApi from '../api/questions';
import * as usersApi from '../api/users';
import './FormPages.css';

export default function QuestionCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    submissionDeadline: '',
    anonymousMode: true,
    targetDepartment: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      const res = await usersApi.getAllDepartments();
      // Extract unique department names from the users
      const uniqueDepartments = [...new Set(res.data
        .filter(user => user.department && user.department.trim() !== '')
        .map(user => user.department)
        .filter(Boolean))];
      setDepartments(uniqueDepartments);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: [],
        difficulty: 'medium',
        submissionDeadline: new Date(form.submissionDeadline).toISOString(),
      };
      const res = await questionsApi.create(payload);
      const q = res.data;
      if (form.publishNow) {
        await questionsApi.publish(q._id);
        navigate(`/senior/questions/${q._id}`);
      } else {
        navigate(`/senior/questions/${q._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <h1>Create Question</h1>
      <form onSubmit={handleSubmit} className="form-card">
        {error && <div className="form-error">{error}</div>}
        <label>
          Title *
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            placeholder="Short title"
          />
        </label>
        <label>
          Description *
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
            rows={6}
            placeholder="Full description and requirements"
          />
        </label>
        <label>
          Target Department
          {departmentsLoading ? (
            <div className="muted">Loading departments...</div>
          ) : (
            <select
              value={form.targetDepartment}
              onChange={(e) => setForm((f) => ({ ...f, targetDepartment: e.target.value }))}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}
        </label>
        <label>
          Submission deadline *
          <input
            type="datetime-local"
            value={form.submissionDeadline}
            onChange={(e) => setForm((f) => ({ ...f, submissionDeadline: e.target.value }))}
            required
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.anonymousMode}
            onChange={(e) => setForm((f) => ({ ...f, anonymousMode: e.target.checked }))}
          />
          Anonymous mode (departments cannot see your identity)
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create (draft)'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate('/senior')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
