import { Response, NextFunction } from 'express';
import { protect } from './auth.js';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { AuthRequest } from '../types/index.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('jsonwebtoken');
vi.mock('../models/Admin.js');

describe('Auth Middleware - protect', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      cookies: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    nextFunction = vi.fn();
    vi.clearAllMocks();
  });

  it('should return 401 if no token is provided', async () => {
    await protect(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Not authorized to access this resource. Please log in as administrator.',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    mockReq.headers = { authorization: 'Bearer invalidtoken' };

    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await protect(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(jwt.verify).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid or expired authorization token.',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token is valid but Admin not found', async () => {
    mockReq.headers = { authorization: 'Bearer validtoken' };

    const mockDecoded = { id: 'adminId' };
    vi.mocked(jwt.verify).mockReturnValue(mockDecoded as any);

    // Admin.findById chained with select
    const mockSelect = vi.fn().mockResolvedValue(null);
    vi.mocked(Admin.findById).mockReturnValue({ select: mockSelect } as any);

    await protect(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(jwt.verify).toHaveBeenCalled();
    expect(Admin.findById).toHaveBeenCalledWith('adminId');
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Administrator session expired or user no longer exists.',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next and set admin on request if token in header is valid', async () => {
    mockReq.headers = { authorization: 'Bearer validtoken' };

    const mockDecoded = { id: 'adminId' };
    vi.mocked(jwt.verify).mockReturnValue(mockDecoded as any);

    const mockAdmin = {
      _id: { toString: () => 'adminId' },
      email: 'admin@example.com',
      role: 'admin',
    };

    const mockSelect = vi.fn().mockResolvedValue(mockAdmin);
    vi.mocked(Admin.findById).mockReturnValue({ select: mockSelect } as any);

    await protect(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(jwt.verify).toHaveBeenCalled();
    expect(Admin.findById).toHaveBeenCalledWith('adminId');

    expect(mockReq.admin).toEqual(mockAdmin);
    expect(mockReq.adminId).toBe('adminId');
    expect(mockReq.adminEmail).toBe('admin@example.com');
    expect(mockReq.adminRole).toBe('admin');

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should call next and set admin on request if token in cookie is valid', async () => {
    mockReq.cookies = { token: 'validcookie' };

    const mockDecoded = { id: 'adminId' };
    vi.mocked(jwt.verify).mockReturnValue(mockDecoded as any);

    const mockAdmin = {
      _id: { toString: () => 'adminId' },
      email: 'admin@example.com',
      role: 'admin',
    };

    const mockSelect = vi.fn().mockResolvedValue(mockAdmin);
    vi.mocked(Admin.findById).mockReturnValue({ select: mockSelect } as any);

    await protect(mockReq as AuthRequest, mockRes as Response, nextFunction);

    expect(jwt.verify).toHaveBeenCalled();
    expect(Admin.findById).toHaveBeenCalledWith('adminId');

    expect(mockReq.admin).toEqual(mockAdmin);
    expect(mockReq.adminId).toBe('adminId');
    expect(mockReq.adminEmail).toBe('admin@example.com');
    expect(mockReq.adminRole).toBe('admin');

    expect(nextFunction).toHaveBeenCalled();
  });
});
