/**
 * AuditLog - immutable log of all significant actions.
 * Never delete or update; append-only for compliance.
 */
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: {
      type: String,
      required: true,
      enum: [
        'user_login',
        'user_register',
        'question_create',
        'question_update',
        'question_publish',
        'question_close',
        'question_complete',
        'question_delete',
        'answer_submit',
        'answer_revise',
        'answer_approve',
        'answer_reject',
        'comment_add',
        'comment_resolve',
        'compilation_save',
        'compilation_approve',
        'user_status_toggle',
        'registration_approve',
        'registration_reject'
      ],
    },
    resourceType: {
      type: String,
      enum: ['User', 'Question', 'Answer', 'AnswerVersion', 'InlineComment'],
    },
    resourceId: mongoose.Schema.Types.ObjectId,
    metadata: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
