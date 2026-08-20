import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password.' });
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() });

  if (admin && (await admin.matchPassword(password))) {
    const token = generateToken(admin._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token,
    });
  } else {
    return res.status(401).json({ error: 'Invalid admin email or security password.' });
  }
});

// @desc    Get current admin profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    _id: req.admin._id,
    name: req.admin.name,
    email: req.admin.email,
    role: req.admin.role,
  });
});

// @desc    Admin logout
// @route   POST /api/auth/logout
// @access  Public
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;
