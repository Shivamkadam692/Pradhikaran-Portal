import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as questionsApi from '../api/questions';
import './Dashboard.css';

const STATUS_LABELS = { draft: 'Draft', open: 'Open', closed: 'Closed', completed: 'Completed' };

export default function SeniorDashboard() {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    questionsApi
      .listMine({ status: filter || undefined })
      .then((res) => setQuestions(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleDateString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Questions</h1>
        <Link to="/senior/questions/new" className="btn btn-primary">New Question</Link>
      </div>
      <div className="dashboard-toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : questions.length === 0 ? (
        <div className="empty-state">
          <p>No questions yet. Create one to get started.</p>
          <Link to="/senior/questions/new" className="btn btn-primary">Create Question</Link>
        </div>
      ) : (
        <div className="card-list">
          {questions.map((q) => (
            <div key={q._id} className="card">
              <div className="card-head">
                <Link to={`/senior/questions/${q._id}`} className="card-title">{q.title}</Link>
                <span className={`status status-${q.status}`}>{STATUS_LABELS[q.status] || q.status}</span>
              </div>
              <p className="card-desc">{q.description?.slice(0, 120)}...</p>
              <div className="card-meta">
                <span>Deadline: {formatDate(q.submissionDeadline)}</span>
              </div>
              <div className="card-actions">
                <Link to={`/senior/questions/${q._id}`} className="btn btn-ghost btn-sm">View</Link>
                {q.status === 'open' || q.status === 'closed' ? (
                  <Link to={`/senior/questions/${q._id}/review`} className="btn btn-primary btn-sm">Review</Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
