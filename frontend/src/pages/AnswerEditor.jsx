import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as questionsApi from '../api/questions';
import * as answersApi from '../api/answers';
import * as feedbackApi from '../api/feedback';
import { useSocket } from '../context/SocketContext';
import './FormPages.css';

export default function AnswerEditor() {
  const { id: questionId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [question, setQuestion] = useState(null);
  const [myAnswer, setMyAnswer] = useState(null);
  const [versions, setVersions] = useState([]);
  const [content, setContent] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    questionsApi.getOne(questionId).then((res) => setQuestion(res.data)).catch(() => setQuestion(null)).finally(() => setLoading(false));
  }, [questionId]);

  useEffect(() => {
    if (!question) return;
    answersApi.listByQuestion(questionId).then((res) => {
      const list = res.data || [];
      // For researchers, API returns only their answers; senior sees all
      const mine = list.length > 0 ? list[0] : null;
      setMyAnswer(mine);
      if (mine) {
        setContent(mine.content || '');
        answersApi.getVersions(mine._id).then((r) => setVersions(r.data || []));
        feedbackApi.listComments(mine._id).then((r) => setComments(r.data || []));
      }
    });
  }, [question, questionId]);

  useEffect(() => {
    if (!socket || !questionId) return;
    socket.emit('join_question', questionId);
    return () => socket.emit('leave_question', questionId);
  }, [socket, questionId]);

  useEffect(() => {
    if (!socket) return;
    const onRevision = () => {
      if (myAnswer) {
        answersApi.getOne(myAnswer._id).then((r) => setMyAnswer(r.data));
      }
    };
    socket.on('revision_requested', onRevision);
    return () => socket.off('revision_requested', onRevision);
  }, [socket, myAnswer?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await answersApi.submit(questionId, { content, revisionNote });
      setMyAnswer(res.data);
      if (res.version) setVersions((v) => [res.version, ...v]);
      setRevisionNote('');
    } catch (err) {
      setError(err.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
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

  const deadlinePassed = new Date(question.submissionDeadline) < new Date();
  const isOpen = question.status === 'open' && !deadlinePassed;
  const canEdit = !myAnswer || (!myAnswer.isLocked && (myAnswer.status === 'draft' || myAnswer.status === 'revision_requested'));

  return (
    <div className="form-page">
      <div className="detail-header">
        <Link to="/researcher">← Back to questions</Link>
        <h1>{question.title}</h1>
      </div>
      <p className="detail-desc">{question.description}</p>
      <div className="detail-meta">
        <span>Submit by: {formatDate(question.submissionDeadline)}</span>
      </div>

      {!isOpen && (
        <div className="form-error">
          {deadlinePassed ? 'Submission deadline has passed.' : 'This question is not open for submissions.'}
        </div>
      )}

      {myAnswer && (
        <div className="answer-status-bar">
          <span>Status: <strong>{myAnswer.status}</strong></span>
          {myAnswer.status === 'revision_requested' && (
            <span className="warning">Revision requested — please update and resubmit.</span>
          )}
        </div>
      )}

      {myAnswer && comments.length > 0 && (
        <section className="detail-section">
          <h3>Inline feedback</h3>
          <ul className="comment-list">
            {comments.map((c) => (
              <li key={c._id} className={c.resolved ? 'resolved' : ''}>
                <span className="comment-text">"{c.text}"</span>
                {!c.resolved && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => feedbackApi.resolveComment(myAnswer._id, c._id).then(() => setComments((prev) => prev.map((x) => (x._id === c._id ? { ...x, resolved: true } : x))))}
                  >
                    Mark resolved
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={handleSubmit} className="form-card">
        {error && <div className="form-error">{error}</div>}
        <label>
          Your answer
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            disabled={!isOpen || !canEdit}
            placeholder="Write your answer here..."
            className="form-input"
          />
        </label>
        {myAnswer && (
          <label>
            Revision note (optional)
            <input
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="What did you change?"
              disabled={!isOpen || !canEdit}
            />
          </label>
        )}
        {isOpen && canEdit && (
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {myAnswer ? 'Submit revision' : 'Submit answer'}
          </button>
        )}
      </form>

      {versions.length > 0 && (
        <section className="detail-section">
          <h3>Version history</h3>
          <ul className="version-list">
            {versions.map((v) => (
              <li key={v._id}>
                v{v.versionNumber} — {formatDate(v.submittedAt)}
                {v.revisionNote && <span className="muted"> — {v.revisionNote}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
