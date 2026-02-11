/**
 * RBAC++ middleware - role-based access control.
 * Restricts routes by role (pradhikaran_office | departments).
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

const pradhikaranOfficeOnly = requireRole(ROLES.PRADHIKARAN_OFFICE);
const departmentsOnly = requireRole(ROLES.DEPARTMENTS);

module.exports = { requireRole, pradhikaranOfficeOnly, departmentsOnly };
