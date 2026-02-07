/**
 * Answer model - one per researcher per question.
 * Multiple answers per question; each researcher has one Answer document with versions.
 */
const mongoose = require('mongoose');
const { ANSWER_STATUS } = require('../constants/roles');

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ANSWER_STATUS),
      default: ANSWER_STATUS.DRAFT,
    },
    // Current content (latest version content for quick read)
    content: {
      type: String,
      default: '',
    },
    // Approved answers are locked
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// One answer per author per question
answerSchema.index({ question: 1, author: 1 }, { unique: true });
answerSchema.index({ question: 1, status: 1 });

module.exports = mongoose.model('Answer', answerSchema);
