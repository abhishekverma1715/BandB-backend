import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { AuthRequest, IJWTPayload } from '../types/index.js';

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  // Check Bearer token from authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Not authorized to access this resource. Please log in as administrator.',
    });
    return;
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables');
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as IJWTPayload;

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      res.status(401).json({
        success: false,
        error: 'Administrator session expired or user no longer exists.',
      });
      return;
    }

    req.admin = admin;
    req.adminId = admin._id.toString();
    req.adminEmail = admin.email;
    req.adminRole = admin.role;

    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired authorization token.',
    });
  }
};
