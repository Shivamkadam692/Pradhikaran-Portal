/**
 * Auth controller - register, login, JWT issue.
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auditLogger = require('../utils/auditLogger');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

exports.register = async (req, res) => {
  try {
    const { email, password, name, role, department, institution, registrationStatus = 'approved' } = req.body;
    
    // Validate required fields
    if (!email || !password || !name || !role || !department) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields are missing' 
      });
    }
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }
    
    // Department is required for new registrations
    if (!department || !department.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Department is required' 
      });
    }
    
    // Institution is required for Department registrations
    if (role === 'departments' && (!institution || !institution.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Institution is required for department registrations' 
      });
    }
    
    const userData = {
      email,
      password,
      name,
      role,
      department: department.trim(),
      registrationStatus: role === 'departments' ? 'pending' : 'approved' // Departments start pending, Pradhikaran Office auto-approved
    };
    
    // Add institution for departments
    if (role === 'departments' && institution) {
      userData.institution = institution.trim();
    }
    
    const user = await User.create(userData);
    const token = generateToken(user._id);
    
    auditLogger.log({
      userId: user._id,
      action: 'user_register',
      resourceType: 'User',
      resourceId: user._id,
      metadata: { 
        role: user.role, 
        registrationStatus: user.registrationStatus,
        department: user.department,
        institution: user.institution
      },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(201).json({
      success: true,
      token,
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role, 
        department: user.department,
        institution: user.institution,
        registrationStatus: user.registrationStatus
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    // Handle specific error types
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during registration' 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is disabled' 
      });
    }
    
    // Check registration status for Department accounts
    if (user.role === 'departments' && user.registrationStatus !== 'approved') {
      return res.status(401).json({ 
        success: false, 
        message: 'Account pending approval. Please contact Pradhikaran Office.' 
      });
    }
    
    const token = generateToken(user._id);
    auditLogger.log({
      userId: user._id,
      action: 'user_login',
      resourceType: 'User',
      resourceId: user._id,
      metadata: { 
        role: user.role, 
        registrationStatus: user.registrationStatus 
      },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.json({
      success: true,
      token,
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role, 
        department: user.department,
        institution: user.institution,
        registrationStatus: user.registrationStatus 
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request parameters' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during login' 
    });
  }
};

exports.me = async (req, res) => {
  try {
    const u = req.user;
    res.json({
      success: true,
      user: { 
        id: u._id, 
        _id: u._id, 
        email: u.email, 
        name: u.name, 
        role: u.role, 
        department: u.department 
      },
    });
  } catch (err) {
    console.error('Get user info error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error fetching user info' 
    });
  }
};
