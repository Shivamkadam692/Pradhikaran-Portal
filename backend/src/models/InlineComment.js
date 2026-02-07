/**
 * InlineComment - Google-Docs-style feedback on answer content.
 * Stored with position (e.g. startOffset, endOffset or blockId) for rendering.
 */
const mongoose = require('mongoose');

const inlineCommentSchema = new mongoose.Schema(
  {
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer',
      required: true,
    },
    // Which version this comment applies to
    answerVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnswerVersion',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    // Position in content: we use startIndex, endIndex (character offsets)
    startIndex: { type: Number, required: true },
    endIndex: { type: Number, required: true },
    // Resolved when researcher addresses it
    resolved: { type: Boolean, default: false },
    resolvedAt: Date,
  },
  { timestamps: true }
);

inlineCommentSchema.index({ answer: 1, answerVersion: 1 });

module.exports = mongoose.model('InlineComment', inlineCommentSchema);
