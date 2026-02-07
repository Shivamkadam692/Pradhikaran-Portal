/**
 * Inline comments (feedback) - senior adds comments on answer content.
 */
const InlineComment = require('../models/InlineComment');
const AnswerVersion = require('../models/AnswerVersion');
const Notification = require('../models/Notification');
const auditLogger = require('../utils/auditLogger');
const { getIO } = require('../socket');

// Add inline comment (senior only, on answer they own)
exports.add = async (req, res) => {
  try {
    const answer = req.answer;
    if (!req.isAnswerOwner) return res.status(403).json({ success: false, message: 'Only question owner can add comments' });
    const { text, startIndex, endIndex, answerVersionId } = req.body;
    const version = answerVersionId
      ? await AnswerVersion.findOne({ _id: answerVersionId, answer: answer._id })
      : await AnswerVersion.findOne({ answer: answer._id }).sort({ versionNumber: -1 });
    if (!version) return res.status(404).json({ success: false, message: 'Answer version not found' });
    const comment = await InlineComment.create({
      answer: answer._id,
      answerVersion: version._id,
      author: req.user._id,
      text,
      startIndex: Number(startIndex),
      endIndex: Number(endIndex),
    });
    auditLogger.log({
      userId: req.user._id,
      action: 'comment_add',
      resourceType: 'InlineComment',
      resourceId: comment._id,
      metadata: { answerId: answer._id },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    await Notification.create({
      recipient: answer.author,
      type: 'inline_comment',
      title: 'New feedback',
      body: 'You have new inline feedback on your answer.',
      link: `/questions/${answer.question._id}/answers/${answer._id}`,
      resourceType: 'InlineComment',
      resourceId: comment._id,
    });
    const io = getIO();
    if (io) io.to(`user-${answer.author}`).emit('inline_comment', { commentId: comment._id, answerId: answer._id });
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// List comments for an answer (owner or author)
exports.list = async (req, res) => {
  try {
    const comments = await InlineComment.find({ answer: req.answer._id })
      .populate('author', 'name')
      .sort({ createdAt: 1 });
    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Resolve comment (researcher or senior)
exports.resolve = async (req, res) => {
  try {
    const comment = await InlineComment.findOne({
      _id: req.params.commentId,
      answer: req.answer._id,
    });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    comment.resolved = true;
    comment.resolvedAt = new Date();
    await comment.save();
    auditLogger.log({
      userId: req.user._id,
      action: 'comment_resolve',
      resourceType: 'InlineComment',
      resourceId: comment._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
