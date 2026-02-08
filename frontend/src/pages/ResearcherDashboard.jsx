import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as questionsApi from '../api/questions';
import './Dashboard.css';

export default function ResearcherDashboard() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    questionsApi
      .listOpen()
      .then((res) => setQuestions(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, []);

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
        <h1>Open Questions</h1>
      </div>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : questions.length === 0 ? (
        <div className="empty-state">
          <p>No open questions at the moment. Check back later.</p>
        </div>
      ) : (
        <div className="card-list">
          {questions.map((q) => (
            <div key={q._id} className="card">
              <div className="card-head">
                <Link to={`/researcher/questions/${q._id}`} className="card-title">{q.title}</Link>
              </div>
              <p className="card-desc">{q.description?.slice(0, 160)}...</p>
              <div className="card-meta">
                <span>Submit by: {formatDate(q.submissionDeadline)}</span>
              </div>
              <Link to={`/researcher/questions/${q._id}`} className="btn btn-primary btn-sm">Submit Answer</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
