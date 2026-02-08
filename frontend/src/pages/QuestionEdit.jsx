import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as questionsApi from '../api/questions';
import './FormPages.css';

export default function QuestionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    submissionDeadline: '',
    anonymousMode: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    questionsApi.getOne(id).then((res) => {
      const q = res.data;
      setForm({
        title: q.title,
        description: q.description,
        submissionDeadline: q.submissionDeadline ? new Date(q.submissionDeadline).toISOString().slice(0, 16) : '',
        anonymousMode: q.anonymousMode !== false,
      });
    }).catch(() => setError('Question not found')).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await questionsApi.update(id, {
        ...form,
        tags: [],
        difficulty: 'medium',
        submissionDeadline: new Date(form.submissionDeadline).toISOString(),
      });
      navigate(`/senior/questions/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="muted">Loading...</div>;

  return (
    <div className="form-page">
      <h1>Edit Question</h1>
      <form onSubmit={handleSubmit} className="form-card">
        {error && <div className="form-error">{error}</div>}
        <label>Title * <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required /></label>
        <label>Description * <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required rows={6} /></label>
        <label>Submission deadline * <input type="datetime-local" value={form.submissionDeadline} onChange={(e) => setForm((f) => ({ ...f, submissionDeadline: e.target.value }))} required /></label>
        <label className="checkbox-label"><input type="checkbox" checked={form.anonymousMode} onChange={(e) => setForm((f) => ({ ...f, anonymousMode: e.target.checked }))} /> Anonymous mode</label>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <Link to={`/senior/questions/${id}`} className="btn btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
