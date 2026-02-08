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
  const [selectedFiles, setSelectedFiles] = useState([]);
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const blob = await answersApi.downloadFile(myAnswer._id, fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await answersApi.submit(questionId, { content, revisionNote }, selectedFiles);
      setMyAnswer(res.data);
      if (res.version) setVersions((v) => [res.version, ...v]);
      setRevisionNote('');
      setSelectedFiles([]);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
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
      {question.owner && (
        <div className="question-owner-info" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: '4px' }}>
          <strong>Question by:</strong> {question.owner.name} | <strong>Role:</strong> {question.owner.role === 'senior_member' ? 'Senior Member' : 'Researcher'} | <strong>Department:</strong> {question.owner.department}
        </div>
      )}
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

      {myAnswer && myAnswer.status === 'revision_requested' && myAnswer.revisionReason && (
        <div className="revision-reason-section" style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Revision Reason:</h4>
          <p style={{ margin: 0 }}>{myAnswer.revisionReason}</p>
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
          <label>
            Attach documents or research papers (PDF, DOC, DOCX, TXT, Images - max 10MB each, up to 5 files)
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={!isOpen || !canEdit}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
              style={{ marginTop: '0.5rem' }}
            />
            {selectedFiles.length > 0 && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '4px' }}>
                <strong>Selected files:</strong>
                <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                  {selectedFiles.map((file, index) => (
                    <li key={index} style={{ marginBottom: '0.25rem' }}>
                      {file.name} ({formatFileSize(file.size)})
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.85rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </label>
        )}
        {myAnswer && myAnswer.attachments && myAnswer.attachments.length > 0 && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', border: '1px solid #e1e4e8', borderRadius: '4px' }}>
            <strong>Attached documents:</strong>
            <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
              {myAnswer.attachments.map((file) => (
                <li key={file._id} style={{ marginBottom: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleDownload(file._id, file.originalName)}
                    style={{ background: 'none', border: 'none', color: '#0366d6', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  >
                    📎 {file.originalName}
                  </button>
                  <span style={{ color: '#586069', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                    ({formatFileSize(file.size)})
                  </span>
                </li>
              ))}
            </ul>
          </div>
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
