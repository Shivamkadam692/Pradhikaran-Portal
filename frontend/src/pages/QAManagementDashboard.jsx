import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as questionsApi from '../api/questions';
import * as answersApi from '../api/answers';
import './Dashboard.css';

export default function QAManagementDashboard() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [questionsRes, answersRes] = await Promise.all([
        questionsApi.listAll(),
        answersApi.listAll()
      ]);
      
      const questionsData = questionsRes.data || [];
      const answersData = answersRes.data || [];
      
      setQuestions(questionsData);
      setAnswers(answersData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
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
      draft: 'status-badge status-draft',
      open: 'status-badge status-open',
      closed: 'status-badge status-closed',
      completed: 'status-badge status-completed',
      submitted: 'status-badge status-submitted',
      revision_requested: 'status-badge status-revision',
      approved: 'status-badge status-approved',
      rejected: 'status-badge status-rejected'
    };
    return <span className={statusStyles[status] || 'status-badge'}>{status.replace('_', ' ')}</span>;
  };

  const handleDeleteQuestion = async (questionId) => {
    const confirmed = window.confirm('Are you sure you want to delete this question? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      await questionsApi.deleteQuestion(questionId);
      await loadData(); // Refresh data
    } catch (error) {
      alert('Failed to delete question: ' + error.message);
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    const confirmed = window.confirm('Are you sure you want to delete this answer? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      await answersApi.deleteAnswer(answerId);
      await loadData(); // Refresh data
    } catch (error) {
      alert('Failed to delete answer: ' + error.message);
    }
  };

  if (loading) {
    return <div className="muted">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Questions & Answers Management</h1>
          <p className="header-subtitle">Oversee all questions and answers in the system</p>
        </div>
        <div className="header-actions">
          <Link to="/pradhikaran/admin" className="btn btn-ghost">
            System Admin
          </Link>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'questions' ? 'tab-active' : ''}
          onClick={() => setActiveTab('questions')}
        >
          All Questions ({questions.length})
        </button>
        <button 
          className={activeTab === 'answers' ? 'tab-active' : ''}
          onClick={() => setActiveTab('answers')}
        >
          All Answers ({answers.length})
        </button>
      </div>

      {activeTab === 'questions' ? (
        <div className="section">
          <h2>All Questions</h2>
          {questions.length === 0 ? (
            <div className="empty-state">
              <p>No questions found</p>
            </div>
          ) : (
            <div className="card-list">
              {questions.map((question) => (
                <div key={question._id} className="card">
                  <div className="card-head">
                    <h3 className="card-title">{question.title}</h3>
                    {getStatusBadge(question.status)}
                  </div>
                  <div className="card-content">
                    <p><strong>Description:</strong> {question.description?.slice(0, 100)}...</p>
                    <p><strong>Department:</strong> {question.owner?.department || 'N/A'}</p>
                    <p><strong>Created by:</strong> {question.owner?.name || 'Unknown'}</p>
                    <p><strong>Created:</strong> {formatDate(question.createdAt)}</p>
                    {question.submissionDeadline && (
                      <p><strong>Deadline:</strong> {formatDate(question.submissionDeadline)}</p>
                    )}
                    <p><strong>Answers:</strong> {question.answerCount || 0}</p>
                  </div>
                  <div className="card-actions">
                    <Link to={`/pradhikaran/questions/${question._id}`} className="btn btn-primary">
                      View Details
                    </Link>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDeleteQuestion(question._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="section">
          <h2>All Answers</h2>
          {answers.length === 0 ? (
            <div className="empty-state">
              <p>No answers found</p>
            </div>
          ) : (
            <div className="card-list">
              {answers.map((answer) => (
                <div key={answer._id} className="card">
                  <div className="card-head">
                    <h3 className="card-title">Answer to: {answer.question?.title || 'Unknown Question'}</h3>
                    {getStatusBadge(answer.status)}
                  </div>
                  <div className="card-content">
                    <p><strong>Department:</strong> {answer.author?.department || 'N/A'}</p>
                    <p><strong>Submitted by:</strong> {answer.author?.name || 'Unknown'}</p>
                    <p><strong>Submitted:</strong> {formatDate(answer.createdAt)}</p>
                    <p><strong>Last Updated:</strong> {formatDate(answer.updatedAt)}</p>
                    {answer.isLocked && <p><strong>🔒 Locked for review</strong></p>}
                  </div>
                  <div className="card-actions">
                    <Link to={`/pradhikaran/questions/${answer.question?._id}/review`} className="btn btn-primary">
                      Review Answer
                    </Link>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDeleteAnswer(answer._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}