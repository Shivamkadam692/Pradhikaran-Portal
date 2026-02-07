/**
 * Analytics - senior member dashboard metrics.
 */
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const AnswerVersion = require('../models/AnswerVersion');
const InlineComment = require('../models/InlineComment');
const { QUESTION_STATUS, ANSWER_STATUS } = require('../constants/roles');
const mongoose = require('mongoose');

exports.dashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const questions = await Question.find({ owner: userId });
    const questionIds = questions.map((q) => q._id);

    const totalQuestions = questions.length;
    const byStatus = await Question.aggregate([
      { $match: { owner: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));

    const answersAgg = await Answer.aggregate([
      { $match: { question: { $in: questionIds } } },
      { $group: { _id: '$question', count: { $sum: 1 } } },
    ]);
    const totalAnswers = answersAgg.reduce((sum, a) => sum + a.count, 0);
    const avgAnswersPerQuestion = totalQuestions ? (totalAnswers / totalQuestions).toFixed(2) : 0;

    const revisionCount = await AnswerVersion.aggregate([
      { $match: { answer: { $in: (await Answer.find({ question: { $in: questionIds } }).select('_id')).map((a) => a._id) } } },
      { $group: { _id: '$answer', versions: { $sum: 1 } } },
      { $match: { versions: { $gt: 1 } } },
      { $count: 'revisionCycles' },
    ]);
    const revisionCycles = revisionCount[0]?.revisionCycles || 0;

    const completedCount = statusMap[QUESTION_STATUS.COMPLETED] || 0;
    const completionRate = totalQuestions ? ((completedCount / totalQuestions) * 100).toFixed(2) : 0;

    const commentsCount = await InlineComment.countDocuments({
      answer: { $in: (await Answer.find({ question: { $in: questionIds } }).select('_id')).map((a) => a._id) },
      author: userId,
    });

    const domainActivity = await Question.aggregate([
      { $match: { owner: userId } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalQuestions,
        byStatus: statusMap,
        totalAnswers,
        avgAnswersPerQuestion: parseFloat(avgAnswersPerQuestion),
        revisionCycles,
        completionRate: parseFloat(completionRate),
        completedCount,
        commentsCount,
        domainActivity,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
