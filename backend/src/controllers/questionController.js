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
      ownerDepartment: req.user.department || '',
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

// Researcher: questions I've answered
exports.listAnswered = async (req, res) => {
  try {
    const Answer = require('../models/Answer');
    
    // Find all answers by this user
    const answers = await Answer.find({ author: req.user._id }).populate('question');
    
    // Extract unique questions from answers
    const answeredQuestionIds = [...new Set(answers.map(a => a.question._id.toString()))];
    
    // Get the full question details
    const questions = await Question.find({ _id: { $in: answeredQuestionIds } })
      .populate('owner', 'name role department')
      .sort({ updatedAt: -1 });
    
    const data = questions.map((q) => {
      const obj = q.toObject();
      
      // For answered questions, find the latest answer by this user
      const userAnswer = answers
        .filter(a => a.question._id.toString() === q._id.toString())
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
      
      if (userAnswer) {
        obj.myAnswerStatus = userAnswer.status;
        obj.myLastAnswerDate = userAnswer.updatedAt;
      }
      
      if (q.anonymousMode) {
        delete obj.owner;
      }
      return obj;
    });
    
    res.json({ success: true, data });
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
// Only show questions from the same department as the researcher
exports.listOpen = async (req, res) => {
  try {
    const userDepartment = req.user.department || '';
    const filter = {
      status: QUESTION_STATUS.OPEN,
      submissionDeadline: { $gt: new Date() },
    };
    // Only filter by department if user has a department set
    if (userDepartment) {
      filter.ownerDepartment = userDepartment;
    }
    const questions = await Question.find(filter)
      .populate('owner', 'name role department')
      .sort({ submissionDeadline: 1 });
    const data = questions.map((q) => {
      const obj = q.toObject();
      if (q.anonymousMode) {
        delete obj.owner;
      }
      return obj;
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single question (ownership or open for researchers)
exports.getOne = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('owner', 'name role department');
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    const isOwner = question.owner && question.owner._id.toString() === req.user._id.toString();
    if (!isOwner && question.status !== QUESTION_STATUS.OPEN && question.status !== QUESTION_STATUS.CLOSED) {
      return res.status(403).json({ success: false, message: 'Cannot access this question' });
    }
    // For researchers, check if they're from the same department (only if both have departments set)
    if (!isOwner && req.user.department && question.ownerDepartment && question.ownerDepartment !== req.user.department) {
      return res.status(403).json({ success: false, message: 'You can only access questions from your department' });
    }
    const obj = question.toObject();
    // Always include owner info for senior members, or if not in anonymous mode
    if (question.anonymousMode && !isOwner && req.user.role !== 'senior_member') {
      delete obj.owner;
    }
    res.json({ success: true, data: obj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Senior: delete question
exports.deleteQuestion = async (req, res) => {
  try {
    const question = req.question;
    
    // Check if question has answers - prevent deletion if it does
    const Answer = require('../models/Answer');
    const answerCount = await Answer.countDocuments({ question: question._id });
      
    if (answerCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete question that has received answers' 
      });
    }
    
    // Allow deletion of draft and closed questions only
    if (question.status !== QUESTION_STATUS.DRAFT && question.status !== QUESTION_STATUS.CLOSED) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete question in this status' 
      });
    }
    
    // Delete the question
    await Question.findByIdAndDelete(question._id);
    
    auditLogger.log({
      userId: req.user._id,
      action: 'question_delete',
      resourceType: 'Question',
      resourceId: question._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({ success: true, message: 'Question deleted successfully' });
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
