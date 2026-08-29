import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { jest } from '@jest/globals';

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: jest.fn(),
  },
}));

jest.unstable_mockModule('../models/Admin.js', () => ({
  default: {
    findById: jest.fn(),
  },
}));

const jwt = (await import('jsonwebtoken')).default;
const Admin = (await import('../models/Admin.js')).default;
const { protect } = await import('../middleware/auth.js');

describe('Auth Middleware - protect', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      cookies: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any,
    };
    mockNext = jest.fn() as any;
    jest.clearAllMocks();
  });

  it('should return 401 if no token provided', async () => {
    await protect(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Not authorized to access this resource. Please log in as administrator.',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid or expired (catches error)', async () => {
    mockRequest.headers = { authorization: 'Bearer invalid_token' };
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('jwt expired');
    });

    await protect(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid or expired authorization token.',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if valid token but admin not found', async () => {
    mockRequest.headers = { authorization: 'Bearer valid_token' };
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'valid_id' });

    (Admin.findById as jest.Mock).mockReturnValue({
      select: jest.fn<any>().mockResolvedValue(null)
    });

    await protect(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Administrator session expired or user no longer exists.',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should set admin properties and call next on success', async () => {
    mockRequest.headers = { authorization: 'Bearer valid_token' };
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'valid_id' });

    const mockAdmin = {
      _id: { toString: () => 'valid_id' },
      email: 'admin@bbplastics.com',
      role: 'admin'
    };

    (Admin.findById as jest.Mock).mockReturnValue({
      select: jest.fn<any>().mockResolvedValue(mockAdmin)
    });

    await protect(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(mockRequest.admin).toEqual(mockAdmin);
    expect(mockRequest.adminId).toBe('valid_id');
    expect(mockRequest.adminEmail).toBe('admin@bbplastics.com');
    expect(mockRequest.adminRole).toBe('admin');
    expect(mockNext).toHaveBeenCalled();
  });
});
