import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as questionsApi from '../api/questions';
import * as answersApi from '../api/answers';
import * as feedbackApi from '../api/feedback';
import './FormPages.css';
import './ReviewFeedback.css';

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    'draft': { label: 'Draft', color: '#6c757d', bg: '#f8f9fa' },
    'submitted': { label: 'Submitted', color: '#0d6efd', bg: '#e3f2fd' },
    'revision_requested': { label: 'Revision Requested', color: '#fd7e14', bg: '#fff3cd' },
    'approved': { label: 'Approved', color: '#198754', bg: '#d1e7dd' },
    'rejected': { label: 'Rejected', color: '#dc3545', bg: '#f8d7da' }
  };
  
  const config = statusConfig[status] || { label: status, color: '#6c757d', bg: '#f8f9fa' };
  
  return (
    <span 
      className="status-badge"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}`
      }}
    >
      {config.label}
    </span>
  );
};

// Answer card component for the sidebar
const AnswerCard = ({ answer, isSelected, onClick, showStatus = true, onDelete, deletingAnswer }) => (
  <div 
    className={`answer-card ${isSelected ? 'selected' : ''}`}
    onClick={onClick}
  >
    <div className="answer-card-header">
      <div className="answer-author">
        {answer.author?.name || 'Anonymous'}
      </div>
      {showStatus && <StatusBadge status={answer.status} />}
    </div>
    <div className="answer-meta">
      <span className="answer-date">
        {new Date(answer.updatedAt || answer.createdAt).toLocaleDateString()}
      </span>
      <span className="answer-length">
        {answer.content ? `${answer.content.split(' ').length} words` : '0 words'}
      </span>
    </div>
    {answer.revisionReason && (
      <div className="revision-reason">
        <small>📝 {answer.revisionReason}</small>
      </div>
    )}
    <div className="answer-card-actions">
      <button
        className="btn btn-danger btn-sm"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(answer._id);
        }}
        disabled={deletingAnswer === answer._id}
      >
        {deletingAnswer === answer._id ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  </div>
);

// Comment component with resolve functionality
const CommentItem = ({ comment, onResolve, canResolve }) => (
  <div className={`comment-item ${comment.resolved ? 'resolved' : ''}`}>
    <div className="comment-header">
      <div className="comment-author">
        {comment.author?.name || 'Reviewer'}
      </div>
      <div className="comment-date">
        {new Date(comment.createdAt).toLocaleString()}
      </div>
    </div>
    <div className="comment-text">
      {comment.text}
    </div>
    <div className="comment-meta">
      {comment.startIndex !== undefined && comment.endIndex !== undefined && (
        <span className="comment-position">
          Position: {comment.startIndex}-{comment.endIndex}
        </span>
      )}
      {comment.resolved && (
        <span className="resolved-badge">Resolved</span>
      )}
      {!comment.resolved && canResolve && (
        <button 
          className="btn btn-sm btn-outline"
          onClick={() => onResolve(comment._id)}
        >
          Mark Resolved
        </button>
      )}
    </div>
  </div>
);

// Action button component
const ActionButton = ({ onClick, children, variant = 'primary', disabled = false, loading = false }) => (
  <button
    className={`btn btn-${variant} ${loading ? 'loading' : ''}`}
    onClick={onClick}
    disabled={disabled || loading}
  >
    {loading ? 'Processing...' : children}
  </button>
);

export default function ReviewFeedback() {
  const { id: questionId } = useParams();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [comments, setComments] = useState([]);
  const [inlineText, setInlineText] = useState('');
  const [inlineStart, setInlineStart] = useState(0);
  const [inlineEnd, setInlineEnd] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('content'); // content, comments, versions
  const [showResolvedComments, setShowResolvedComments] = useState(false);
  const [deletingAnswer, setDeletingAnswer] = useState(null);

  useEffect(() => {
    questionsApi.getOne(questionId)
      .then((res) => setQuestion(res.data))
      .catch(() => setQuestion(null))
      .finally(() => setLoading(false));
  }, [questionId]);

  useEffect(() => {
    if (!question) return;
    answersApi.listByQuestion(questionId)
      .then((res) => setAnswers(res.data || []));
  }, [question, questionId]);

  useEffect(() => {
    if (!selectedAnswer) {
      setComments([]);
      return;
    }
    feedbackApi.listComments(selectedAnswer._id)
      .then((res) => setComments(res.data || []));
  }, [selectedAnswer]);

  const handleRequestRevision = async () => {
    if (!selectedAnswer) return;
    const revisionReason = window.prompt('Please provide a detailed reason for requesting revision:');
    if (revisionReason === null) return;
    
    setActionLoading(true);
    try {
      await answersApi.requestRevision(selectedAnswer._id, revisionReason || '');
      const updatedAnswer = { 
        ...selectedAnswer, 
        status: 'revision_requested', 
        revisionReason: revisionReason || '' 
      };
      setSelectedAnswer(updatedAnswer);
      setAnswers(prev => prev.map(a => 
        a._id === selectedAnswer._id ? updatedAnswer : a
      ));
    } catch (error) {
      alert('Failed to request revision: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedAnswer) return;
    if (!window.confirm('Are you sure you want to approve this answer?')) return;
    
    setActionLoading(true);
    try {
      await answersApi.approveAnswer(selectedAnswer._id);
      const updatedAnswer = { 
        ...selectedAnswer, 
        status: 'approved', 
        isLocked: true 
      };
      setAnswers(prev => prev.map(a => 
        a._id === selectedAnswer._id ? updatedAnswer : a
      ));
      setSelectedAnswer(updatedAnswer);
    } catch (error) {
      alert('Failed to approve answer: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAnswer) return;
    const reason = window.prompt('Please provide a rejection reason (optional):');
    if (reason === null) return; // User cancelled
    
    setActionLoading(true);
    try {
      await answersApi.rejectAnswer(selectedAnswer._id, reason || undefined);
      const updatedAnswer = { 
        ...selectedAnswer, 
        status: 'rejected' 
      };
      setAnswers(prev => prev.map(a => 
        a._id === selectedAnswer._id ? updatedAnswer : a
      ));
      setSelectedAnswer(updatedAnswer);
    } catch (error) {
      alert('Failed to reject answer: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddInlineComment = async (e) => {
    e.preventDefault();
    if (!selectedAnswer || !inlineText.trim()) return;
    
    setActionLoading(true);
    try {
      await feedbackApi.addComment(selectedAnswer._id, {
        text: inlineText,
        startIndex: inlineStart,
        endIndex: inlineEnd,
      });
      const res = await feedbackApi.listComments(selectedAnswer._id);
      setComments(res.data || []);
      setInlineText('');
    } catch (error) {
      alert('Failed to add comment: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveComment = async (commentId) => {
    try {
      await feedbackApi.resolveComment(selectedAnswer._id, commentId);
      setComments(prev => prev.map(c => 
        c._id === commentId ? { ...c, resolved: true, resolvedAt: new Date() } : c
      ));
    } catch (error) {
      alert('Failed to resolve comment: ' + error.message);
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    const answerToDelete = answers.find(a => a._id === answerId);
    if (!answerToDelete) return;
    
    // Check if answer can be deleted
    if (answerToDelete.isLocked) {
      alert('Cannot delete locked answer');
      return;
    }
    
    if (answerToDelete.status === 'approved') {
      alert('Cannot delete approved answer');
      return;
    }
    
    const confirmed = window.confirm(
      `Are you sure you want to delete this answer by ${answerToDelete.author?.name || 'Anonymous'}?\n\n` +
      `This action cannot be undone and will also delete all associated comments and versions.`
    );
    
    if (!confirmed) return;
    
    setDeletingAnswer(answerId);
    try {
      await answersApi.deleteAnswer(answerId);
      
      // Update the answers list
      setAnswers(prev => prev.filter(a => a._id !== answerId));
      
      // If the deleted answer was selected, clear selection
      if (selectedAnswer?._id === answerId) {
        setSelectedAnswer(null);
      }
      
      // Show success message
      alert('Answer deleted successfully');
    } catch (error) {
      alert('Failed to delete answer: ' + error.message);
    } finally {
      setDeletingAnswer(null);
    }
  };

  const handleSelectText = () => {
    const sel = window.getSelection();
    if (!sel || !selectedAnswer) return;
    const contentEl = document.querySelector('.review-answer-content');
    if (!contentEl) return;
    const content = selectedAnswer.content || '';
    const start = content.indexOf(sel.toString().slice(0, 50));
    if (start >= 0) {
      setInlineStart(start);
      setInlineEnd(start + sel.toString().length);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const blob = await answersApi.downloadFile(selectedAnswer._id, file._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading || !question) return <div className="muted">Loading...</div>;

  const filteredComments = showResolvedComments 
    ? comments 
    : comments.filter(c => !c.resolved);

  return (
    <div className="review-page">
      <div className="review-header">
        <div className="header-content">
          <Link to={`/senior/questions/${questionId}`} className="back-link">
            ← Back to question
          </Link>
          <h1>{question.title}</h1>
          <div className="question-meta">
            <span>Deadline: {new Date(question.submissionDeadline).toLocaleDateString()}</span>
            <span>Status: <StatusBadge status={question.status} /></span>
          </div>
        </div>
      </div>

      <div className="review-layout">
        {/* Sidebar - Answers List */}
        <aside className="review-sidebar">
          <div className="sidebar-header">
            <h2>Answers ({answers.length})</h2>
          </div>
          <div className="answers-list">
            {answers.length === 0 ? (
              <div className="no-answers">
                <p>No answers submitted yet.</p>
              </div>
            ) : (
              answers.map((answer) => (
                <AnswerCard
                  key={answer._id}
                  answer={answer}
                  isSelected={selectedAnswer?._id === answer._id}
                  onClick={() => setSelectedAnswer(answer)}
                  onDelete={handleDeleteAnswer}
                  deletingAnswer={deletingAnswer}
                />
              ))
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="review-main">
          {!selectedAnswer ? (
            <div className="no-selection">
              <h3>Select an answer to review</h3>
              <p>Choose an answer from the sidebar to begin your review.</p>
            </div>
          ) : (
            <div className="review-content">
              {/* Tabs */}
              <div className="review-tabs">
                <button 
                  className={`tab ${activeTab === 'content' ? 'active' : ''}`}
                  onClick={() => setActiveTab('content')}
                >
                  Answer Content
                </button>
                <button 
                  className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('comments')}
                >
                  Feedback ({filteredComments.length})
                </button>
                <button 
                  className={`tab ${activeTab === 'info' ? 'active' : ''}`}
                  onClick={() => setActiveTab('info')}
                >
                  Answer Info
                </button>
              </div>

              {/* Content Tab */}
              {activeTab === 'content' && (
                <div className="tab-content">
                  <div className="content-header">
                    <h3>Answer by {selectedAnswer.author?.name || 'Anonymous'}</h3>
                    <StatusBadge status={selectedAnswer.status} />
                  </div>
                  
                  <div 
                    className="review-answer-content" 
                    onMouseUp={handleSelectText}
                  >
                    {(selectedAnswer.content || '').split('\n').map((p, i) => (
                      <p key={i}>{p || <br />}</p>
                    ))}
                  </div>

                  {/* Attachments */}
                  {selectedAnswer.attachments && selectedAnswer.attachments.length > 0 && (
                    <div className="attachments-section">
                      <h4>📎 Attached Documents</h4>
                      <div className="attachments-list">
                        {selectedAnswer.attachments.map((file) => (
                          <div key={file._id} className="attachment-item">
                            <button
                              className="attachment-link"
                              onClick={() => handleDownloadFile(file)}
                            >
                              {file.originalName}
                            </button>
                            <span className="file-size">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline Comment Form */}
                  {!selectedAnswer.isLocked && (
                    <div className="inline-comment-form">
                      <h4>Add Inline Feedback</h4>
                      <p className="form-hint">
                        Select text in the answer above, then add your comment below.
                      </p>
                      <form onSubmit={handleAddInlineComment}>
                        <textarea
                          value={inlineText}
                          onChange={(e) => setInlineText(e.target.value)}
                          placeholder="Your detailed feedback..."
                          rows={3}
                          className="form-input"
                          disabled={actionLoading}
                        />
                        <div className="form-actions">
                          <ActionButton 
                            type="submit" 
                            variant="primary" 
                            disabled={!inlineText.trim() || actionLoading}
                            loading={actionLoading}
                          >
                            Add Comment
                          </ActionButton>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <div className="tab-content">
                  <div className="comments-header">
                    <h3>Feedback & Comments</h3>
                    <div className="comments-controls">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={showResolvedComments}
                          onChange={(e) => setShowResolvedComments(e.target.checked)}
                        />
                        Show resolved comments
                      </label>
                    </div>
                  </div>
                  
                  <div className="comments-list">
                    {filteredComments.length === 0 ? (
                      <div className="no-comments">
                        <p>No {showResolvedComments ? '' : 'unresolved '}comments yet.</p>
                      </div>
                    ) : (
                      filteredComments.map((comment) => (
                        <CommentItem
                          key={comment._id}
                          comment={comment}
                          onResolve={handleResolveComment}
                          canResolve={!comment.resolved}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Info Tab */}
              {activeTab === 'info' && (
                <div className="tab-content">
                  <div className="info-section">
                    <h3>Answer Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Author</label>
                        <span>{selectedAnswer.author?.name || 'Anonymous'}</span>
                      </div>
                      <div className="info-item">
                        <label>Status</label>
                        <StatusBadge status={selectedAnswer.status} />
                      </div>
                      <div className="info-item">
                        <label>Submitted</label>
                        <span>{new Date(selectedAnswer.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="info-item">
                        <label>Last Updated</label>
                        <span>{new Date(selectedAnswer.updatedAt).toLocaleString()}</span>
                      </div>
                      <div className="info-item">
                        <label>Word Count</label>
                        <span>{selectedAnswer.content ? selectedAnswer.content.split(' ').length : 0} words</span>
                      </div>
                      <div className="info-item">
                        <label>Character Count</label>
                        <span>{selectedAnswer.content ? selectedAnswer.content.length : 0} characters</span>
                      </div>
                    </div>
                    
                    {selectedAnswer.isLocked && (
                      <div className="locked-notice">
                        <p>🔒 This answer is locked and cannot be modified.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!selectedAnswer.isLocked && (
                <div className="review-actions">
                  <div className="actions-header">
                    <h3>Review Actions</h3>
                  </div>
                  <div className="actions-grid">
                    <ActionButton
                      onClick={handleRequestRevision}
                      variant="warning"
                      disabled={actionLoading}
                      loading={actionLoading}
                    >
                      Request Revision
                    </ActionButton>
                    <ActionButton
                      onClick={handleApprove}
                      variant="success"
                      disabled={actionLoading}
                      loading={actionLoading}
                    >
                      Approve Answer
                    </ActionButton>
                    <ActionButton
                      onClick={handleReject}
                      variant="danger"
                      disabled={actionLoading}
                      loading={actionLoading}
                    >
                      Reject Answer
                    </ActionButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}