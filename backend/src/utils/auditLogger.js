/**
 * Audit logger - appends immutable audit log entries.
 * Call after successful actions; never throws to avoid breaking request flow.
 */
const AuditLog = require('../models/AuditLog');

const log = async (payload) => {
  try {
    await AuditLog.create({
      user: payload.userId,
      action: payload.action,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      metadata: payload.metadata || {},
      ip: payload.ip,
      userAgent: payload.userAgent,
    });
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
};

module.exports = { log };
