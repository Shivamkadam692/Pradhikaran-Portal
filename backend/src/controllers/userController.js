/**
 * User management controller - handle registration approvals, user management
 */
const User = require('../models/User');
const Notification = require('../models/Notification');
const auditLogger = require('../utils/auditLogger');
const { getIO } = require('../socket');

// Get pending department registrations (Pradhikaran Office only)
exports.getPendingRegistrations = async (req, res) => {
  try {
    // Only Pradhikaran Office can access this
    if (req.user.role !== 'pradhikaran_office') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const pendingUsers = await User.find({ 
      role: 'departments', 
      registrationStatus: 'pending' 
    })
    .select('-password')
    .sort({ createdAt: -1 });
    
    res.json({ success: true, data: pendingUsers });
  } catch (err) {
    console.error('Error getting pending registrations:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid request parameters' });
    }
    res.status(500).json({ success: false, message: 'Internal server error while fetching pending registrations' });
  }
};

// Approve department registration
exports.approveRegistration = async (req, res) => {
  try {
    // Only Pradhikaran Office can approve
    if (req.user.role !== 'pradhikaran_office') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.role !== 'departments') {
      return res.status(400).json({ success: false, message: 'Can only approve department registrations' });
    }
    
    if (user.registrationStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'User already approved' });
    }
    
    user.registrationStatus = 'approved';
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();
    
    // Create notification for the user
    await Notification.create({
      recipient: user._id,
      type: 'registration_approved',
      title: 'Registration Approved',
      body: 'Your department registration has been approved by Pradhikaran Office.',
      link: '/departments/login',
      resourceType: 'User',
      resourceId: user._id,
    });
    
    // Send real-time notification
    const io = getIO();
    if (io) {
      io.to(`user-${user._id}`).emit('registration_approved', { 
        userId: user._id,
        message: 'Your registration has been approved' 
      });
    }
    
    auditLogger.log({
      userId: req.user._id,
      action: 'registration_approve',
      resourceType: 'User',
      resourceId: user._id,
      metadata: { 
        approvedUserId: user._id,
        department: user.department || 'N/A',
        institution: user.institution || 'N/A'
      },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({ success: true, message: 'Registration approved successfully', data: user });
  } catch (err) {
    console.error('Error in approveRegistration:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    res.status(500).json({ success: false, message: 'Internal server error during registration approval' });
  }
};

// Reject department registration
exports.rejectRegistration = async (req, res) => {
  try {
    // Only Pradhikaran Office can reject
    if (req.user.role !== 'pradhikaran_office') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { reason = '' } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.role !== 'departments') {
      return res.status(400).json({ success: false, message: 'Can only reject department registrations' });
    }
    
    if (user.registrationStatus === 'rejected') {
      return res.status(400).json({ success: false, message: 'User already rejected' });
    }
    
    user.registrationStatus = 'rejected';
    await user.save();
    
    // Create notification for the user
    await Notification.create({
      recipient: user._id,
      type: 'registration_rejected',
      title: 'Registration Rejected',
      body: reason ? `Your registration was rejected: ${reason}` : 'Your department registration was rejected.',
      link: '/departments/register',
      resourceType: 'User',
      resourceId: user._id,
    });
    
    // Send real-time notification
    const io = getIO();
    if (io) {
      io.to(`user-${user._id}`).emit('registration_rejected', { 
        userId: user._id,
        message: 'Your registration has been rejected',
        reason: reason
      });
    }
    
    auditLogger.log({
      userId: req.user._id,
      action: 'registration_reject',
      resourceType: 'User',
      resourceId: user._id,
      metadata: { 
        rejectedUserId: user._id,
        reason: reason,
        department: user.department || 'N/A',
        institution: user.institution || 'N/A'
      },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({ success: true, message: 'Registration rejected successfully' });
  } catch (err) {
    console.error('Error in rejectRegistration:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    res.status(500).json({ success: false, message: 'Internal server error during registration rejection' });
  }
};

// Get all departments for management
exports.getAllDepartments = async (req, res) => {
  try {
    // Only Pradhikaran Office can access this
    if (req.user.role !== 'pradhikaran_office') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const departments = await User.find({ role: 'departments' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: departments });
  } catch (err) {
    console.error('Error getting all departments:', err);
    res.status(500).json({ success: false, message: 'Internal server error while fetching departments' });
  }
};

// Toggle user active status
exports.toggleUserStatus = async (req, res) => {
  try {
    // Only Pradhikaran Office can toggle status
    if (req.user.role !== 'pradhikaran_office') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    auditLogger.log({
      userId: req.user._id,
      action: 'user_status_toggle',
      resourceType: 'User',
      resourceId: user._id,
      metadata: { 
        targetUserId: user._id,
        newStatus: user.isActive ? 'active' : 'inactive'
      },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({ 
      success: true, 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user 
    });
  } catch (err) {
    console.error('Error toggling user status:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    res.status(500).json({ success: false, message: 'Internal server error while toggling user status' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    // Only Pradhikaran Office can access other users' data
    if (req.user.role !== 'pradhikaran_office' && req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Error getting user by ID:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    res.status(500).json({ success: false, message: 'Internal server error while fetching user' });
  }
};

// Update user information
exports.updateUser = async (req, res) => {
  try {
    const { name, department, institution, isActive, registrationStatus } = req.body;
    
    // Users can only update their own info, Pradhikaran Office can update any user
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (req.user.role !== 'pradhikaran_office' && req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Update fields if provided
    if (name) user.name = name.trim();
    if (department) user.department = department.trim();
    if (institution && user.role === 'departments') user.institution = institution.trim();
    if (isActive !== undefined) user.isActive = isActive;
    if (registrationStatus) user.registrationStatus = registrationStatus;
    
    await user.save();
    
    auditLogger.log({
      userId: req.user._id,
      action: 'user_update',
      resourceType: 'User',
      resourceId: user._id,
      metadata: { 
        updatedUserId: user._id,
        fieldsUpdated: Object.keys(req.body)
      },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({ 
      success: true, 
      message: 'User updated successfully',
      data: user 
    });
  } catch (err) {
    console.error('Error updating user:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors 
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error while updating user' });
  }
};