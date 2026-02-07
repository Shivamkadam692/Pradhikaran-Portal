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
    const { email, password, name, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({ email, password, name, role });
    const token = generateToken(user._id);
    auditLogger.log({
      userId: user._id,
      action: 'user_register',
      resourceType: 'User',
      resourceId: user._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is disabled' });
    }
    const token = generateToken(user._id);
    auditLogger.log({
      userId: user._id,
      action: 'user_login',
      resourceType: 'User',
      resourceId: user._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.me = async (req, res) => {
  const u = req.user;
  res.json({
    success: true,
    user: { id: u._id, _id: u._id, email: u.email, name: u.name, role: u.role },
  });
};
