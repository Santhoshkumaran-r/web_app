const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper: generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register a new user (role: user by default)
// @access  Public
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Prevent anyone from self-registering as admin
    const safeRole = role === 'admin' ? 'user' : role || 'user';

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }

    const user = await User.create({ name, email, password, role: safeRole });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login — works for admin, vendor, and user
// @access  Public
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find user and explicitly include password (it's select: false in schema)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check if the user is trying to log in via the correct portal
    // E.g., someone with role 'user' shouldn't log in via Admin portal
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `This account is not registered as a ${role}. Please use the correct login portal.`,
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,   // ← ADD THIS

      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get current logged-in user's profile
// @access  Private (requires token)
// ─────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// ─────────────────────────────────────────────
// @route   POST /api/auth/create-admin
// @desc    Create a new admin account (only existing admin can do this)
// @access  Private + Admin only
// ─────────────────────────────────────────────
router.post('/create-admin', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }

    const admin = await User.create({ name, email, password, role: 'admin' });

    res.status(201).json({
      success: true,
      message: 'Admin account created.',
      user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// ─────────────────────────────────────────────
// @route   PUT /api/auth/change-password
// @desc    Change password (clears isFirstLogin flag)
// @access  Private
// ─────────────────────────────────────────────
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save(); // bcrypt hash triggers automatically via pre-save hook

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────
// @route   PUT /api/auth/skip-password-change
// @desc    User chooses to keep current password — clears isFirstLogin flag
// @access  Private
// ─────────────────────────────────────────────
router.put('/skip-password-change', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isFirstLogin: false });
    res.status(200).json({ success: true, message: 'Preference saved.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;
