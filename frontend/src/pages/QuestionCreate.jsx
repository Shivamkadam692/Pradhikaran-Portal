import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as questionsApi from '../api/questions';
import './FormPages.css';

export default function QuestionCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: '',
    difficulty: 'medium',
    submissionDeadline: '',
    anonymousMode: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
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
          Tags (comma-separated)
          <input
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="e.g. biology, statistics"
          />
        </label>
        <label>
          Difficulty
          <select
            value={form.difficulty}
            onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
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
          Anonymous mode (researchers cannot see your identity)
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
