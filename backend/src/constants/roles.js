/**
 * Role constants for RBAC++.
 * SENIOR_MEMBER: question owner, reviewer, compiler, approver
 * RESEARCHER: answer submitter, can only see own answers
 */
const ROLES = {
  SENIOR_MEMBER: 'senior_member',
  RESEARCHER: 'researcher',
};

const QUESTION_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  CLOSED: 'closed',
  COMPLETED: 'completed',
};

const ANSWER_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  REVISION_REQUESTED: 'revision_requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

module.exports = {
  ROLES,
  QUESTION_STATUS,
  ANSWER_STATUS,
};
