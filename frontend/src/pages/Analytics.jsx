import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as analyticsApi from '../api/analytics';
import './FormPages.css';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getDashboard().then((res) => setData(res.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="muted">Loading...</div>;
  if (!data) return <div className="form-error">Failed to load analytics.</div>;

  const d = data;

  return (
    <div className="form-page">
      <div className="detail-header">
        <Link to="/senior">← Dashboard</Link>
        <h1>Analytics</h1>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Total questions</h3>
          <p className="analytics-value">{d.totalQuestions}</p>
        </div>
        <div className="analytics-card">
          <h3>Total answers</h3>
          <p className="analytics-value">{d.totalAnswers}</p>
        </div>
        <div className="analytics-card">
          <h3>Avg answers per question</h3>
          <p className="analytics-value">{d.avgAnswersPerQuestion}</p>
        </div>
        <div className="analytics-card">
          <h3>Completion rate</h3>
          <p className="analytics-value">{d.completionRate}%</p>
        </div>
        <div className="analytics-card">
          <h3>Completed</h3>
          <p className="analytics-value">{d.completedCount}</p>
        </div>
        <div className="analytics-card">
          <h3>Revision cycles</h3>
          <p className="analytics-value">{d.revisionCycles}</p>
        </div>
      </div>

      <section className="detail-section">
        <h2>By status</h2>
        <ul className="analytics-list">
          {Object.entries(d.byStatus || {}).map(([status, count]) => (
            <li key={status}>{status}: {count}</li>
          ))}
        </ul>
      </section>

      {d.domainActivity?.length > 0 && (
        <section className="detail-section">
          <h2>Domain activity (tags)</h2>
          <ul className="analytics-list">
            {d.domainActivity.map((item) => (
              <li key={item._id}>{item._id}: {item.count}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
