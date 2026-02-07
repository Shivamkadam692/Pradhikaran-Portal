/**
 * Question controller - CRUD, publish, status, list for researchers (open only).
 */
const Question = require('../models/Question');
const { QUESTION_STATUS } = require('../constants/roles');
const auditLogger = require('../utils/auditLogger');

// Senior: create question
exports.create = async (req, res) => {
  try {
    const { title, description, tags, difficulty, submissionDeadline, anonymousMode } = req.body;
    const question = await Question.create({
      title,
      description,
      tags: tags || [],
      difficulty: difficulty || 'medium',
      submissionDeadline: new Date(submissionDeadline),
      anonymousMode: anonymousMode !== false,
      owner: req.user._id,
      status: QUESTION_STATUS.DRAFT,
    });
    auditLogger.log({
      userId: req.user._id,
      action: 'question_create',
      resourceType: 'Question',
      resourceId: question._id,
      metadata: { title: question.title },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Senior: list my questions
exports.listMine = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { owner: req.user._id };
    if (status) filter.status = status;
    const questions = await Question.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Researcher: list open questions (no owner identity in anonymous mode)
exports.listOpen = async (req, res) => {
  try {
    const questions = await Question.find({
      status: QUESTION_STATUS.OPEN,
      submissionDeadline: { $gt: new Date() },
    })
      .select('-owner')
      .sort({ submissionDeadline: 1 });
    const data = questions.map((q) => q.toObject());
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single question (ownership or open for researchers)
exports.getOne = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    const isOwner = question.owner.toString() === req.user._id.toString();
    if (!isOwner && question.status !== QUESTION_STATUS.OPEN && question.status !== QUESTION_STATUS.CLOSED) {
      return res.status(403).json({ success: false, message: 'Cannot access this question' });
    }
    const obj = question.toObject();
    if (question.anonymousMode && !isOwner) delete obj.owner;
    res.json({ success: true, data: obj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Senior: update question (draft only)
exports.update = async (req, res) => {
  try {
    const question = req.question;
    if (question.status !== QUESTION_STATUS.DRAFT) {
      return res.status(400).json({ success: false, message: 'Can only edit draft questions' });
    }
    const { title, description, tags, difficulty, submissionDeadline, anonymousMode } = req.body;
    if (title != null) question.title = title;
    if (description != null) question.description = description;
    if (tags != null) question.tags = tags;
    if (difficulty != null) question.difficulty = difficulty;
    if (submissionDeadline != null) question.submissionDeadline = new Date(submissionDeadline);
    if (anonymousMode !== undefined) question.anonymousMode = anonymousMode;
    await question.save();
    auditLogger.log({
      userId: req.user._id,
      action: 'question_update',
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

// Senior: publish draft -> open
exports.publish = async (req, res) => {
  try {
    const question = req.question;
    if (question.status !== QUESTION_STATUS.DRAFT) {
      return res.status(400).json({ success: false, message: 'Only draft can be published' });
    }
    question.status = QUESTION_STATUS.OPEN;
    await question.save();
    auditLogger.log({
      userId: req.user._id,
      action: 'question_publish',
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

// Used by cron or senior to close (deadline passed or manual)
exports.closeQuestion = async (req, res) => {
  try {
    const question = req.question;
    if (question.status !== QUESTION_STATUS.OPEN) {
      return res.status(400).json({ success: false, message: 'Only open questions can be closed' });
    }
    question.status = QUESTION_STATUS.CLOSED;
    await question.save();
    auditLogger.log({
      userId: req.user._id,
      action: 'question_close',
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
