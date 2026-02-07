import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as questionsApi from '../api/questions';
import * as answersApi from '../api/answers';
import * as feedbackApi from '../api/feedback';
import './FormPages.css';

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

  useEffect(() => {
    questionsApi.getOne(questionId).then((res) => setQuestion(res.data)).catch(() => setQuestion(null)).finally(() => setLoading(false));
  }, [questionId]);

  useEffect(() => {
    if (!question) return;
    answersApi.listByQuestion(questionId).then((res) => setAnswers(res.data || []));
  }, [question, questionId]);

  useEffect(() => {
    if (!selectedAnswer) {
      setComments([]);
      return;
    }
    feedbackApi.listComments(selectedAnswer._id).then((res) => setComments(res.data || []));
  }, [selectedAnswer]);

  const handleRequestRevision = async () => {
    if (!selectedAnswer) return;
    setActionLoading(true);
    try {
      await answersApi.requestRevision(selectedAnswer._id);
      setSelectedAnswer((a) => (a ? { ...a, status: 'revision_requested' } : null));
      setAnswers((list) => list.map((a) => (a._id === selectedAnswer._id ? { ...a, status: 'revision_requested' } : a)));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedAnswer) return;
    setActionLoading(true);
    try {
      await answersApi.approveAnswer(selectedAnswer._id);
      setAnswers((list) => list.map((a) => (a._id === selectedAnswer._id ? { ...a, status: 'approved', isLocked: true } : a)));
      setSelectedAnswer((a) => (a ? { ...a, status: 'approved', isLocked: true } : null));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAnswer) return;
    const reason = window.prompt('Rejection reason (optional):');
    setActionLoading(true);
    try {
      await answersApi.rejectAnswer(selectedAnswer._id, reason || undefined);
      setAnswers((list) => list.map((a) => (a._id === selectedAnswer._id ? { ...a, status: 'rejected' } : a)));
      setSelectedAnswer((a) => (a ? { ...a, status: 'rejected' } : null));
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
    } finally {
      setActionLoading(false);
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

  if (loading || !question) return <div className="muted">Loading...</div>;

  return (
    <div className="form-page review-page">
      <div className="detail-header">
        <Link to={`/senior/questions/${questionId}`}>← Back to question</Link>
        <h1>Review: {question.title}</h1>
      </div>

      <div className="review-layout">
        <aside className="review-sidebar">
          <h3>Answers</h3>
          {answers.length === 0 ? (
            <p className="muted">No answers yet.</p>
          ) : (
            <ul className="answer-picker">
              {answers.map((a) => (
                <li key={a._id}>
                  <button
                    type="button"
                    className={selectedAnswer?._id === a._id ? 'active' : ''}
                    onClick={() => setSelectedAnswer(a)}
                  >
                    {a.author?.name || 'Anonymous'} — {a.status}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="review-main">
          {!selectedAnswer ? (
            <p className="muted">Select an answer to review.</p>
          ) : (
            <>
              <div className="review-answer-content" onMouseUp={handleSelectText}>
                {(selectedAnswer.content || '').split('\n').map((p, i) => (
                  <p key={i}>{p || <br />}</p>
                ))}
              </div>

              <section className="inline-comment-form">
                <h4>Add inline comment</h4>
                <p className="muted small">Select text above, then add your comment.</p>
                <form onSubmit={handleAddInlineComment}>
                  <textarea
                    value={inlineText}
                    onChange={(e) => setInlineText(e.target.value)}
                    placeholder="Your feedback..."
                    rows={2}
                    className="form-input"
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={actionLoading || !inlineText.trim()}>
                    Add comment
                  </button>
                </form>
              </section>

              <section className="existing-comments">
                <h4>Comments</h4>
                {comments.length === 0 ? (
                  <p className="muted">No comments yet.</p>
                ) : (
                  <ul className="comment-list">
                    {comments.map((c) => (
                      <li key={c._id} className={c.resolved ? 'resolved' : ''}>
                        {c.text}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {!selectedAnswer.isLocked && (
                <div className="review-actions">
                  <button onClick={handleRequestRevision} className="btn btn-ghost" disabled={actionLoading}>
                    Request revision
                  </button>
                  <button onClick={handleApprove} className="btn btn-primary" disabled={actionLoading}>
                    Approve answer
                  </button>
                  <button onClick={handleReject} className="btn btn-danger" disabled={actionLoading}>
                    Reject
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
