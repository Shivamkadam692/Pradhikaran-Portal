const express = require('express');
const { body } = require('express-validator');
const { register, login, me } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name must be less than 100 characters'),
    body('role').isIn(['pradhikaran_office', 'departments']).withMessage('Invalid role specified'),
    body('department').trim().notEmpty().withMessage('Department is required').isLength({ max: 100 }).withMessage('Department must be less than 100 characters'),
    body('institution').optional({ nullable: true }).trim().isLength({ max: 150 }).withMessage('Institution must be less than 150 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 1 }).withMessage('Password cannot be empty')
  ],
  validate,
  login
);

router.get('/me', protect, me);

module.exports = router;
