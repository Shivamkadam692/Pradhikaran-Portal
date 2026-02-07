/**
 * Compilation & approval - senior compiles final answer and marks question completed.
 */
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { QUESTION_STATUS, ANSWER_STATUS } = require('../constants/roles');
const auditLogger = require('../utils/auditLogger');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

// Save compiled answer (senior only, question owner)
exports.saveCompilation = async (req, res) => {
  try {
    const question = req.question;
    if (question.status !== QUESTION_STATUS.CLOSED && question.status !== QUESTION_STATUS.OPEN) {
      return res.status(400).json({ success: false, message: 'Question must be open or closed to compile' });
    }
    const { content } = req.body;
    question.compiledAnswer = {
      content: content || question.compiledAnswer?.content || '',
      compiledAt: new Date(),
      approvedAt: null,
    };
    await question.save();
    auditLogger.log({
      userId: req.user._id,
      action: 'compilation_save',
      resourceType: 'Question',
      resourceId: question._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Approve compiled answer -> mark question COMPLETED, lock approved answers if any
exports.approveCompilation = async (req, res) => {
  try {
    const question = req.question;
    if (!question.compiledAnswer?.content) {
      return res.status(400).json({ success: false, message: 'Compile an answer first' });
    }
    question.compiledAnswer.approvedAt = new Date();
    question.status = QUESTION_STATUS.COMPLETED;
    await question.save();
    await Answer.updateMany(
      { question: question._id, status: ANSWER_STATUS.APPROVED },
      { $set: { isLocked: true } }
    );
    auditLogger.log({
      userId: req.user._id,
      action: 'compilation_approve',
      resourceType: 'Question',
      resourceId: question._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    const answers = await Answer.find({ question: question._id }).select('author');
    for (const a of answers) {
      await Notification.create({
        recipient: a.author,
        type: 'question_completed',
        title: 'Question completed',
        body: `The question has been completed and the final answer approved.`,
        link: `/questions/${question._id}`,
        resourceType: 'Question',
        resourceId: question._id,
      });
    }
    const io = getIO();
    if (io) io.to(`question-${question._id}`).emit('question_completed', { questionId: question._id });
    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Senior: approve one answer (optional - can approve multiple for compilation)
exports.approveAnswer = async (req, res) => {
  try {
    const answer = req.answer;
    if (!req.isAnswerOwner) return res.status(403).json({ success: false, message: 'Only question owner can approve' });
    answer.status = ANSWER_STATUS.APPROVED;
    answer.isLocked = true;
    await answer.save();
    auditLogger.log({
      userId: req.user._id,
      action: 'answer_approve',
      resourceType: 'Answer',
      resourceId: answer._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    await Notification.create({
      recipient: answer.author,
      type: 'answer_approved',
      title: 'Answer approved',
      body: 'Your answer has been approved.',
      link: `/questions/${answer.question._id}/answers/${answer._id}`,
      resourceType: 'Answer',
      resourceId: answer._id,
    });
    const io = getIO();
    if (io) io.to(`user-${answer.author}`).emit('answer_approved', { answerId: answer._id });
    res.json({ success: true, data: answer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Senior: reject answer
exports.rejectAnswer = async (req, res) => {
  try {
    const answer = req.answer;
    if (!req.isAnswerOwner) return res.status(403).json({ success: false, message: 'Only question owner can reject' });
    if (answer.isLocked) return res.status(400).json({ success: false, message: 'Answer is locked' });
    answer.status = ANSWER_STATUS.REJECTED;
    await answer.save();
    auditLogger.log({
      userId: req.user._id,
      action: 'answer_reject',
      resourceType: 'Answer',
      resourceId: answer._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    await Notification.create({
      recipient: answer.author,
      type: 'answer_rejected',
      title: 'Answer rejected',
      body: req.body.reason || 'Your answer was rejected.',
      link: `/questions/${answer.question._id}/answers/${answer._id}`,
      resourceType: 'Answer',
      resourceId: answer._id,
    });
    const io = getIO();
    if (io) io.to(`user-${answer.author}`).emit('answer_rejected', { answerId: answer._id });
    res.json({ success: true, data: answer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
