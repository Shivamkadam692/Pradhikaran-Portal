import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as analyticsApi from '../api/analytics';
import './FormPages.css';
import './Analytics.css';

// Simple bar chart component
const BarChart = ({ data, title, color = '#3b82f6' }) => {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="bar-chart">
        {data.map((item, index) => (
          <div key={index} className="bar-item">
            <div 
              className="bar" 
              style={{
                height: `${(item.value / maxValue) * 100}%`,
                backgroundColor: color
              }}
            />
            <span className="bar-label">{item.label}</span>
            <span className="bar-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Status card component
const StatusCard = ({ title, value, subtitle, icon, color = 'var(--accent)' }) => (
  <div className="status-card">
    <div className="card-icon" style={{ color }}>
      {icon}
    </div>
    <div className="card-content">
      <h3 className="card-value">{value}</h3>
      <p className="card-title">{title}</p>
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
    </div>
  </div>
);

// Progress ring component
const ProgressRing = ({ progress, size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="progress-ring-container">
      <svg
        className="progress-ring"
        height={size}
        width={size}
      >
        <circle
          className="progress-ring-background"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="progress-ring-progress"
          stroke="var(--success)"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="progress-text">{progress}%</div>
    </div>
  );
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    analyticsApi.getDashboard()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="muted">Loading analytics...</div>;
  if (!data) return <div className="form-error">Failed to load analytics.</div>;

  const d = data;

  // Prepare data for charts
  const statusData = Object.entries(d.byStatus || {}).map(([status, count]) => ({
    label: status.charAt(0).toUpperCase() + status.slice(1),
    value: count
  }));

  const answerStatusData = Object.entries(d.answerStatusDistribution || {}).map(([status, count]) => ({
    label: status.replace(/_/g, ' ').toUpperCase(),
    value: count
  }));

  const domainData = (d.domainActivity || []).map(item => ({
    label: item._id,
    value: item.count
  }));

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="header-content">
          <Link to="/senior" className="back-link">← Back to Dashboard</Link>
          <h1>Analytics Dashboard</h1>
          <p className="header-subtitle">Comprehensive insights into your research activities</p>
        </div>
        <div className="header-actions">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="all">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="7">Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <section className="metrics-section">
        <h2>Key Performance Indicators</h2>
        <div className="metrics-grid">
          <StatusCard 
            title="Total Questions" 
            value={d.totalQuestions} 
            icon="📝"
            color="#3b82f6"
          />
          <StatusCard 
            title="Total Answers" 
            value={d.totalAnswers} 
            icon="💬"
            color="#10b981"
          />
          <StatusCard 
            title="Completion Rate" 
            value={`${d.completionRate}%`} 
            subtitle={`${d.completedCount} completed`}
            icon="✅"
            color="#8b5cf6"
          />
          <StatusCard 
            title="Avg. Answers/Question" 
            value={d.avgAnswersPerQuestion} 
            icon="📊"
            color="#f59e0b"
          />
        </div>
      </section>

      {/* Progress and Charts */}
      <div className="analytics-content">
        <div className="main-content">
          {/* Question Status Distribution */}
          <section className="chart-section">
            <h2>Question Status Distribution</h2>
            <BarChart data={statusData} title="Questions by Status" color="#3b82f6" />
          </section>

          {/* Answer Status Distribution */}
          <section className="chart-section">
            <h2>Answer Status Distribution</h2>
            <BarChart data={answerStatusData} title="Answers by Status" color="#10b981" />
          </section>

          {/* Domain Activity */}
          {domainData.length > 0 && (
            <section className="chart-section">
              <h2>Top Research Domains</h2>
              <BarChart data={domainData} title="Questions by Domain" color="#8b5cf6" />
            </section>
          )}

          {/* Top Performing Questions */}
          {d.topPerformingQuestions && d.topPerformingQuestions.length > 0 && (
            <section className="chart-section">
              <h2>Top Performing Questions</h2>
              <div className="top-questions-list">
                {d.topPerformingQuestions.map((question, index) => (
                  <div key={question._id} className="question-item">
                    <div className="question-rank">#{index + 1}</div>
                    <div className="question-info">
                      <h4>{question.title}</h4>
                      <div className="question-meta">
                        <span className="answer-count">{question.answerCount} answers</span>
                        <span className="question-status">{question.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="sidebar">
          {/* Completion Progress */}
          <div className="sidebar-card">
            <h3>Completion Progress</h3>
            <div className="progress-container">
              <ProgressRing progress={d.completionRate} />
              <div className="progress-stats">
                <p>{d.completedCount} of {d.totalQuestions} questions completed</p>
                <p className="small">Average completion time: {d.averageCompletionTime || 0} days</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="sidebar-card">
            <h3>Recent Activity</h3>
            <div className="activity-stats">
              <div className="activity-item">
                <span className="activity-label">Questions (30 days)</span>
                <span className="activity-value">{d.recentActivity?.questions || 0}</span>
              </div>
              <div className="activity-item">
                <span className="activity-label">Answers (30 days)</span>
                <span className="activity-value">{d.recentActivity?.answers || 0}</span>
              </div>
              <div className="activity-item">
                <span className="activity-label">Revision Cycles</span>
                <span className="activity-value">{d.revisionCycles}</span>
              </div>
              <div className="activity-item">
                <span className="activity-label">Inline Comments</span>
                <span className="activity-value">{d.commentsCount}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="sidebar-card">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <Link to="/senior/questions/new" className="btn btn-primary btn-sm">
                Create New Question
              </Link>
              <Link to="/senior" className="btn btn-ghost btn-sm">
                View All Questions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}