/**
 * Answer controller - submit, revise, version history.
 * Researchers see only their own answers; senior sees all for the question.
 */
const Answer = require('../models/Answer');
const AnswerVersion = require('../models/AnswerVersion');
const Question = require('../models/Question');
const { QUESTION_STATUS, ANSWER_STATUS } = require('../constants/roles');
const auditLogger = require('../utils/auditLogger');
const { getIO } = require('../socket');

// Researcher: submit or create answer for an open question
exports.submit = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    if (question.status !== QUESTION_STATUS.OPEN) {
      return res.status(400).json({ success: false, message: 'Question is not open for submissions' });
    }
    if (new Date() > question.submissionDeadline) {
      return res.status(400).json({ success: false, message: 'Submission deadline has passed' });
    }
    let answer = await Answer.findOne({ question: question._id, author: req.user._id });
    const content = req.body.content || '';
    const revisionNote = req.body.revisionNote;
    if (!answer) {
      answer = await Answer.create({
        question: question._id,
        author: req.user._id,
        content,
        status: ANSWER_STATUS.SUBMITTED,
      });
      const version = await AnswerVersion.create({
        answer: answer._id,
        versionNumber: 1,
        content,
        revisionNote: revisionNote || 'Initial submission',
      });
      auditLogger.log({
        userId: req.user._id,
        action: 'answer_submit',
        resourceType: 'Answer',
        resourceId: answer._id,
        metadata: { questionId: question._id, version: 1 },
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      const io = getIO();
      if (io) {
        io.to(`question-${question._id}`).emit('new_answer', { answerId: answer._id, questionId: question._id });
      }
      return res.status(201).json({ success: true, data: answer, version: version });
    }
    if (answer.isLocked) {
      return res.status(400).json({ success: false, message: 'Answer is locked' });
    }
    // Prevent editing if already submitted and not in revision requested state
    if (answer.status !== ANSWER_STATUS.DRAFT && answer.status !== ANSWER_STATUS.REVISION_REQUESTED) {
      return res.status(400).json({ success: false, message: 'Cannot edit answer after submission unless revision is requested' });
    }
    const nextVersion = (await AnswerVersion.countDocuments({ answer: answer._id })) + 1;
    const version = await AnswerVersion.create({
      answer: answer._id,
      versionNumber: nextVersion,
      content,
      revisionNote: revisionNote || (nextVersion === 1 ? 'Initial submission' : 'Revision'),
    });
    answer.content = content;
    answer.status = ANSWER_STATUS.SUBMITTED;
    await answer.save();
    auditLogger.log({
      userId: req.user._id,
      action: answer.versions ? 'answer_revise' : 'answer_submit',
      resourceType: 'Answer',
      resourceId: answer._id,
      metadata: { questionId: question._id, version: nextVersion },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    const io = getIO();
    if (io) {
      io.to(`question-${question._id}`).emit('answer_updated', { answerId: answer._id, questionId: question._id });
    }
    res.json({ success: true, data: answer, version });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get answers: senior gets all for question; researcher gets only own
exports.listByQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    const isOwner = question.owner.toString() === req.user._id.toString();
    const filter = { question: question._id };
    if (!isOwner) filter.author = req.user._id;
    const answers = await Answer.find(filter)
      .populate('author', isOwner ? 'name email' : 'name') // anonymous: don't send email
      .sort({ updatedAt: -1 });
    const data = answers.map((a) => {
      const o = a.toObject();
      if (question.anonymousMode && !isOwner) {
        if (o.author) o.author = { _id: o.author._id, name: 'Anonymous' };
      }
      return o;
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get one answer (with ownership check already done in middleware)
exports.getOne = async (req, res) => {
  try {
    const answer = await Answer.findById(req.answer._id)
      .populate('question', 'title owner anonymousMode')
      .populate('author', 'name email');
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found' });
    const isOwner = req.isAnswerOwner;
    const obj = answer.toObject();
    if (answer.question.anonymousMode && !isOwner && obj.author) {
      obj.author = { _id: obj.author._id, name: 'Anonymous' };
    }
    res.json({ success: true, data: obj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Version history for an answer
exports.getVersions = async (req, res) => {
  try {
    const versions = await AnswerVersion.find({ answer: req.answer._id }).sort({ versionNumber: -1 });
    res.json({ success: true, data: versions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Senior: request revision (set status to revision_requested)
exports.requestRevision = async (req, res) => {
  try {
    const answer = req.answer;
    if (!req.isAnswerOwner) return res.status(403).json({ success: false, message: 'Only question owner can request revision' });
    if (answer.isLocked) return res.status(400).json({ success: false, message: 'Answer is locked' });
    answer.status = ANSWER_STATUS.REVISION_REQUESTED;
    await answer.save();
    auditLogger.log({
      userId: req.user._id,
      action: 'answer_revise',
      resourceType: 'Answer',
      resourceId: answer._id,
      metadata: { requestRevision: true },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: answer.author,
      type: 'revision_requested',
      title: 'Revision requested',
      body: `Your answer needs revision.`,
      link: `/questions/${answer.question._id}/answers/${answer._id}`,
      resourceType: 'Answer',
      resourceId: answer._id,
    });
    const io = getIO();
    if (io) io.to(`user-${answer.author}`).emit('revision_requested', { answerId: answer._id });
    res.json({ success: true, data: answer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
