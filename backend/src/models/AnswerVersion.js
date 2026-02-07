/**
 * AnswerVersion - version history for each answer.
 * Each revision creates a new version; content is stored here.
 */
const mongoose = require('mongoose');

const answerVersionSchema = new mongoose.Schema(
  {
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer',
      required: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    // Optional note from researcher on this revision
    revisionNote: String,
  },
  { timestamps: true }
);

answerVersionSchema.index({ answer: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.model('AnswerVersion', answerVersionSchema);
