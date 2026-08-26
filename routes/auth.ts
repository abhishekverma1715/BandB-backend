import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import Admin from '../models/Admin.js';
import { protect } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Helper to generate 7-day JWT
const generateToken = (id: string, email: string, role: string): string => {
  return jwt.sign(
    { id, email, role },
    (process.env.JWT_SECRET as string) || 'bb-plastic-jwt-secret-key-2025',
    { expiresIn: '7d' }
  );
};

// @desc    Authenticate admin & return JWT token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid input data',
      });
      return;
    }

    const { email, password } = parseResult.data;
    const cleanEmail = email.toLowerCase().trim();

    // Check admin by email
    const admin = await Admin.findOne({ email: cleanEmail }).select('+password');

    if (!admin) {
      // Fallback for default seed admin if database is in fresh state
      if (
        cleanEmail === 'manishverma123@gmail.com' &&
        password === 'Mahi@742'
      ) {
        const seedAdmin = await Admin.create({
          name: 'Manish Verma (Factory Director)',
          email: 'manishverma123@gmail.com',
          password: 'Mahi@742',
          role: 'Super Admin',
        });
        const token = generateToken(seedAdmin._id.toString(), seedAdmin.email, seedAdmin.role);
        res.json({
          success: true,
          _id: seedAdmin._id,
          name: seedAdmin.name,
          email: seedAdmin.email,
          role: seedAdmin.role,
          token,
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: 'Invalid administrator credentials.',
      });
      return;
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid administrator credentials.',
      });
      return;
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id.toString(), admin.email, admin.role);

    // Set HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Server error during login authentication.',
    });
  }
});

// @desc    Get current admin profile
// @route   GET /api/auth/me
// @access  Private (Admin)
router.get('/me', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password').lean();
    if (!admin) {
      res.status(404).json({ success: false, error: 'Admin record not found.' });
      return;
    }

    res.json({
      success: true,
      data: admin,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @desc    Log out admin & clear auth cookies
// @route   POST /api/auth/logout
// @access  Public
router.post('/logout', (_req: Request, res: Response): void => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Zod Validation for profile update
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Admin display name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
});

// Zod Validation for password update
const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// @desc    Update admin display name & email
// @route   PUT /api/auth/profile
// @access  Private (Admin)
router.put('/profile', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid input data',
      });
      return;
    }

    const { name, email } = parseResult.data;
    const cleanEmail = email.toLowerCase().trim();

    // Find admin by ID
    let admin = await Admin.findById(req.adminId);
    if (!admin && req.adminEmail) {
      admin = await Admin.findOne({ email: req.adminEmail });
    }

    if (!admin) {
      res.status(404).json({ success: false, error: 'Admin account not found.' });
      return;
    }

    // Check if email changed and is taken by another account
    if (cleanEmail !== admin.email) {
      const existing = await Admin.findOne({ email: cleanEmail });
      if (existing && existing._id.toString() !== admin._id.toString()) {
        res.status(400).json({ success: false, error: 'Email address is already in use by another admin.' });
        return;
      }
    }

    admin.name = name.trim();
    admin.email = cleanEmail;
    await admin.save();

    const token = generateToken(admin._id.toString(), admin.email, admin.role);

    res.json({
      success: true,
      message: 'Admin profile updated successfully.',
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error updating admin profile.' });
  }
});

// @desc    Update admin password
// @route   PUT /api/auth/password
// @access  Private (Admin)
router.put('/password', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = updatePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid password data',
      });
      return;
    }

    const { currentPassword, newPassword } = parseResult.data;

    let admin = await Admin.findById(req.adminId).select('+password');
    if (!admin && req.adminEmail) {
      admin = await Admin.findOne({ email: req.adminEmail }).select('+password');
    }

    if (!admin) {
      res.status(404).json({ success: false, error: 'Admin account not found.' });
      return;
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, error: 'Current password is incorrect.' });
      return;
    }

    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error updating password.' });
  }
});

export default router;
