/**
 * Notification - in-app notifications for real-time alerts.
 * Used with Socket.IO for delivery; also stored for history.
 */
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'new_answer',
        'revision_requested',
        'answer_approved',
        'answer_rejected',
        'deadline_reminder',
        'question_closed',
        'question_completed',
        'inline_comment',
      ],
    },
    title: { type: String, required: true },
    body: String,
    link: String, // e.g. /questions/:id or /answers/:id
    resourceType: String,
    resourceId: mongoose.Schema.Types.ObjectId,
    read: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
