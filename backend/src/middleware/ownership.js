/**
 * Ownership validation - ensures user can access the resource.
 * - Question: only owner (senior) can manage
 * - Answer: owner of question (senior) OR author of answer (researcher)
 */
const Question = require('../models/Question');
const Answer = require('../models/Answer');

const isQuestionOwner = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.questionId || req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    if (question.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not the question owner' });
    }
    req.question = question;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const canAccessAnswer = async (req, res, next) => {
  try {
    const answer = await Answer.findById(req.params.answerId || req.params.id)
      .populate('question', 'owner');
    if (!answer) {
      return res.status(404).json({ success: false, message: 'Answer not found' });
    }
    const isOwner = answer.question.owner.toString() === req.user._id.toString();
    const isAuthor = answer.author.toString() === req.user._id.toString();
    if (!isOwner && !isAuthor) {
      return res.status(403).json({ success: false, message: 'Cannot access this answer' });
    }
    req.answer = answer;
    req.isAnswerOwner = isOwner;
    req.isAnswerAuthor = isAuthor;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { isQuestionOwner, canAccessAnswer };
