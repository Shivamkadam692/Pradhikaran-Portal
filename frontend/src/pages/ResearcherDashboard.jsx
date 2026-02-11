import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as questionsApi from '../api/questions';
import './Dashboard.css';

export default function ResearcherDashboard() {
  const [questions, setQuestions] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open'); // 'open' or 'answered'

  useEffect(() => {
    if (activeTab === 'open') {
      questionsApi
        .listOpen()
        .then((res) => setQuestions(Array.isArray(res?.data) ? res.data : []))
        .catch(() => setQuestions([]))
        .finally(() => setLoading(false));
    } else if (activeTab === 'answered') {
      questionsApi
        .listAnswered()
        .then((res) => setAnsweredQuestions(Array.isArray(res?.data) ? res.data : []))
        .catch(() => setAnsweredQuestions([]))
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try {
      const date = new Date(d);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Invalid Date';
    }
  };

  const renderQuestions = (qs) => {
    if (loading) {
      return <p className="muted">Loading...</p>;
    }
    
    if (qs.length === 0) {
      return (
        <div className="empty-state">
          <p>{activeTab === 'open' 
            ? 'No open questions at the moment. Check back later.' 
            : 'No answered questions yet. Start by submitting answers to open questions.'}</p>
        </div>
      );
    }
    
    return (
      <div className="card-list">
        {qs.map((q) => (
          <div key={q._id} className="card">
            <div className="card-head">
              <Link to={`/researcher/questions/${q._id}`} className="card-title">{q.title}</Link>
            </div>
            <p className="card-desc">{q.description?.slice(0, 160)}...</p>
            <div className="card-meta">
              {activeTab === 'open' ? (
                <span>Submit by: {formatDate(q.submissionDeadline)}</span>
              ) : (
                <>
                  <span>Status: {q.myAnswerStatus || 'Unknown'}</span>
                  <span>Last Updated: {formatDate(q.myLastAnswerDate)}</span>
                </>
              )}
            </div>
            {activeTab === 'open' ? (
              <Link to={`/researcher/questions/${q._id}`} className="btn btn-primary btn-sm">Submit Answer</Link>
            ) : (
              <Link to={`/researcher/questions/${q._id}`} className="btn btn-primary btn-sm">View Answer</Link>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{activeTab === 'open' ? 'Open Questions' : 'My Answered Questions'}</h1>
        <div className="tabs">
          <button 
            className={activeTab === 'open' ? 'tab-active' : ''}
            onClick={() => setActiveTab('open')}
          >
            Open Questions
          </button>
          <button 
            className={activeTab === 'answered' ? 'tab-active' : ''}
            onClick={() => setActiveTab('answered')}
          >
            My Answered Questions
          </button>
        </div>
      </div>
      {activeTab === 'open' 
        ? renderQuestions(questions) 
        : renderQuestions(answeredQuestions)}
    </div>
  );
}
