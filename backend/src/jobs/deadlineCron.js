/**
 * Cron job: close questions whose submission deadline has passed.
 * Runs every minute.
 */
const cron = require('node-cron');
const Question = require('../models/Question');
const { QUESTION_STATUS } = require('../constants/roles');
const Notification = require('../models/Notification');

const runDeadlineCheck = async () => {
  const now = new Date();
  const toClose = await Question.find({
    status: QUESTION_STATUS.OPEN,
    submissionDeadline: { $lte: now },
  }).select('_id owner title');
  for (const q of toClose) {
    await Question.updateOne({ _id: q._id }, { $set: { status: QUESTION_STATUS.CLOSED } });
    await Notification.create({
      recipient: q.owner,
      type: 'question_closed',
      title: 'Question closed',
      body: `"${q.title}" has been closed (deadline passed).`,
      link: `/questions/${q._id}`,
      resourceType: 'Question',
      resourceId: q._id,
    });
  }
};

const startDeadlineCron = () => {
  cron.schedule('* * * * *', runDeadlineCheck); // every minute
  console.log('Deadline cron started (every minute)');
};

module.exports = { startDeadlineCron, runDeadlineCheck };
