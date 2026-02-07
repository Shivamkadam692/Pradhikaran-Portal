/**
 * RBAC++ middleware - role-based access control.
 * Restricts routes by role (senior_member | researcher).
 */
const { ROLES } = require('../constants/roles');

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

const seniorOnly = requireRole(ROLES.SENIOR_MEMBER);
const researcherOnly = requireRole(ROLES.RESEARCHER);

module.exports = { requireRole, seniorOnly, researcherOnly };
