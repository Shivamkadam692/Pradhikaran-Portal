import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as questionsApi from '../api/questions';
import * as answersApi from '../api/answers';
import * as compilationApi from '../api/compilation';
import './FormPages.css';

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [compilation, setCompilation] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    questionsApi.getOne(id).then((res) => setQuestion(res.data)).catch(() => setQuestion(null)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!question) return;
    answersApi.listByQuestion(question._id).then((res) => setAnswers(res.data || []));
    if (question.compiledAnswer?.content) setCompilation(question.compiledAnswer.content);
  }, [question]);

  const handlePublish = async () => {
    setActionLoading(true);
    try {
      await questionsApi.publish(id);
      setQuestion((q) => (q ? { ...q, status: 'open' } : null));
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    setActionLoading(true);
    try {
      await questionsApi.close(id);
      setQuestion((q) => (q ? { ...q, status: 'closed' } : null));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCompilation = async () => {
    setActionLoading(true);
    try {
      const res = await compilationApi.saveCompilation(id, compilation);
      setQuestion(res.data);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCompilation = async () => {
    setActionLoading(true);
    try {
      await compilationApi.approveCompilation(id);
      setQuestion((q) => (q ? { ...q, status: 'completed' } : null));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !question) return <div className="muted">Loading...</div>;

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="form-page">
      <div className="detail-header">
        <h1>{question.title}</h1>
        <span className={`status status-${question.status}`}>{question.status}</span>
      </div>
      <p className="detail-desc">{question.description}</p>
      <div className="detail-meta">
        <span>Deadline: {formatDate(question.submissionDeadline)}</span>
        {Array.isArray(question.tags) && question.tags.length > 0 && <span>Tags: {question.tags.join(', ')}</span>}
      </div>

      {question.status === 'draft' && (
        <div className="detail-actions">
          <button onClick={handlePublish} className="btn btn-primary" disabled={actionLoading}>
            Publish (open for submissions)
          </button>
          <Link to={`/senior/questions/${id}/edit`} className="btn btn-ghost">Edit</Link>
        </div>
      )}

      {(question.status === 'open' || question.status === 'closed') && (
        <div className="detail-actions">
          <Link to={`/senior/questions/${id}/review`} className="btn btn-primary">Review answers</Link>
          {question.status === 'open' && (
            <button onClick={handleClose} className="btn btn-ghost" disabled={actionLoading}>
              Close question
            </button>
          )}
        </div>
      )}

      {answers.length > 0 && (
        <section className="detail-section">
          <h2>Answers ({answers.length})</h2>
          <p className="muted">Review and add feedback in the Review page.</p>
          <Link to={`/senior/questions/${id}/review`} className="btn btn-primary btn-sm">Go to Review</Link>
        </section>
      )}

      {(question.status === 'closed' || question.status === 'open') && (
        <section className="detail-section">
          <h2>Compiled answer</h2>
          <p className="muted">Compose the final answer from one or more submissions, then approve.</p>
          <textarea
            value={compilation}
            onChange={(e) => setCompilation(e.target.value)}
            rows={8}
            className="form-input"
            placeholder="Paste or compose the final authoritative answer..."
          />
          <div className="form-actions">
            <button onClick={handleSaveCompilation} className="btn btn-primary" disabled={actionLoading}>
              Save compilation
            </button>
            <button
              onClick={handleApproveCompilation}
              className="btn btn-primary"
              disabled={actionLoading || !compilation.trim()}
            >
              Approve & complete question
            </button>
          </div>
        </section>
      )}

      {question.status === 'completed' && question.compiledAnswer?.content && (
        <section className="detail-section">
          <h2>Final answer (approved)</h2>
          <div className="compiled-content">{question.compiledAnswer.content}</div>
        </section>
      )}
    </div>
  );
}
