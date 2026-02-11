/**
 * Role constants for RBAC++.
 * PRADHIKARAN_OFFICE: question owner, reviewer, compiler, approver, manages department registrations
 * DEPARTMENTS: answer submitter, can only see own answers, requires approval for registration
 */
const ROLES = {
  PRADHIKARAN_OFFICE: 'pradhikaran_office',
  DEPARTMENTS: 'departments',
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
