/**
 * Question model - created by Senior Member.
 * Supports tags, difficulty, deadline, anonymous mode.
 */
const mongoose = require('mongoose');
const { QUESTION_STATUS } = require('../constants/roles');

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: Object.values(QUESTION_STATUS),
      default: QUESTION_STATUS.DRAFT,
    },
    submissionDeadline: {
      type: Date,
      required: true,
    },
    anonymousMode: {
      type: Boolean,
      default: true,
    },
    // Senior member who owns this question (never exposed to researchers in anonymous mode)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Compiled final answer (set when senior compiles and approves)
    compiledAnswer: {
      content: String,
      compiledAt: Date,
      approvedAt: Date,
    },
  },
  { timestamps: true }
);

questionSchema.index({ owner: 1, status: 1 });
questionSchema.index({ submissionDeadline: 1, status: 1 });
questionSchema.index({ tags: 1 });

module.exports = mongoose.model('Question', questionSchema);
