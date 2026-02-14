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
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    questionsApi.getOne(id).then((res) => setQuestion(res.data)).catch((err) => {
      console.error('Error loading question:', err);
      setQuestion(null);
    }).finally(() => setLoading(false));
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

  const handleDeleteQuestion = async () => {
    // Only allow deletion of draft or closed questions
    if (question.status !== 'draft' && question.status !== 'closed') {
      alert('Only draft or closed questions can be deleted');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the question "${question.title}"?\n\n` +
      `This action cannot be undone and will permanently remove the question.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      console.log('Attempting to delete question with ID:', id);
      const token = localStorage.getItem('token');
      console.log('Current token:', token ? 'Present' : 'Missing');
      await questionsApi.deleteQuestion(id);
      console.log('Question deleted successfully');
      // Navigate back to dashboard
      navigate('/senior');
    } catch (error) {
      console.error('Error deleting question:', error);
      console.error('Error response:', error.response);
      if (error.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
      } else if (error.response?.status === 403) {
        alert('You do not have permission to delete this question.');
      } else {
        alert('Failed to delete question: ' + error.message);
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="muted">Loading...</div>;
  if (!question) return (
    <div className="form-page">
      <div className="detail-header">
        <button onClick={() => navigate('/senior')} className="btn btn-ghost">
          ← Back to dashboard
        </button>
        <h1>Question Not Found</h1>
      </div>
      <div className="form-error">
        The question could not be loaded. It may not exist or you don't have permission to view it.
      </div>
    </div>
  );

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
      {question.owner && (
        <div className="question-owner-info" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px' }}>
          <strong>Question by:</strong> {question.owner.name} | <strong>Role:</strong> {question.owner.role === 'senior_member' ? 'Senior Member' : 'Researcher'} | <strong>Department:</strong> {question.owner.department}
        </div>
      )}
      <p className="detail-desc">{question.description}</p>
      <div className="detail-meta">
        <span>Deadline: {formatDate(question.submissionDeadline)}</span>
        {question.targetDepartment && (
          <span>Target Department: {question.targetDepartment}</span>
        )}
      </div>

      {question.status === 'draft' && (
        <div className="detail-actions">
          <button onClick={handlePublish} className="btn btn-primary" disabled={actionLoading}>
            Publish (open for submissions)
          </button>
          <Link to={`/senior/questions/${id}/edit`} className="btn btn-ghost">Edit</Link>
          <button 
            onClick={handleDeleteQuestion} 
            className="btn btn-danger" 
            disabled={deleting || actionLoading}
          >
            {deleting ? 'Deleting...' : 'Delete Question'}
          </button>
        </div>
      )}

      {question.status === 'closed' && (
        <div className="detail-actions">
          <button 
            onClick={handleDeleteQuestion} 
            className="btn btn-danger" 
            disabled={deleting || actionLoading}
          >
            {deleting ? 'Deleting...' : 'Delete Question'}
          </button>
        </div>
      )}

      {question.status === 'open' && (
        <div className="detail-actions">
          <Link to={`/senior/questions/${id}/review`} className="btn btn-primary">Review answers</Link>
          <button onClick={handleClose} className="btn btn-ghost" disabled={actionLoading}>
            Close question
          </button>
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
