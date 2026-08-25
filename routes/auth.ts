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

export default router;
