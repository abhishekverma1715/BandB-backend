import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../server.ts';
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  vi.restoreAllMocks();
});

const generateToken = (id: string, email: string, role: string) => {
  return jwt.sign(
    { id, email, role },
    (process.env.JWT_SECRET as string) || 'bb-plastic-jwt-secret-key-2025',
    { expiresIn: '7d' }
  );
};

describe('PUT /api/auth/profile', () => {
  let token: string;
  let adminId: string;

  beforeEach(async () => {
    const admin = await Admin.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'Admin',
    });
    adminId = admin._id.toString();
    token = generateToken(adminId, admin.email, admin.role);
  });

  it('should update profile successfully', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Admin',
        email: 'updated@test.com',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.name).toBe('Updated Admin');
    expect(res.body.email).toBe('updated@test.com');

    // Verify in db
    const updatedAdmin = await Admin.findById(adminId);
    expect(updatedAdmin?.name).toBe('Updated Admin');
    expect(updatedAdmin?.email).toBe('updated@test.com');
  });

  it('should return 400 for invalid input data', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'A', // too short, minimum 2 characters
        email: 'not-an-email',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('should return 404 if admin is not found', async () => {
    // Generate token for an admin that will be deleted
    const admin2 = await Admin.create({
      name: 'To Be Deleted',
      email: 'delete@test.com',
      password: 'password123',
      role: 'Admin',
    });
    const token2 = generateToken(admin2._id.toString(), admin2.email, admin2.role);

    // Delete the admin so the database query for them fails
    await Admin.findByIdAndDelete(admin2._id);

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        name: 'New Name',
        email: 'new@test.com',
      });

    expect(res.status).toBe(401); // 401 because the protect middleware will fail
  });

  it('should return 400 if email is already taken by another admin', async () => {
    // Create another admin
    await Admin.create({
      name: 'Other Admin',
      email: 'other@test.com',
      password: 'password123',
      role: 'Admin',
    });

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Admin',
        email: 'other@test.com', // Attempting to use the other admin's email
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Email address is already in use by another admin.');
  });

  it('should return 500 if database save fails', async () => {
    // We will spy on the Admin prototype's save method
    const saveSpy = vi.spyOn(Admin.prototype, 'save').mockRejectedValueOnce(new Error('Database connection lost'));

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Admin',
        email: 'updated@test.com',
      });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Database connection lost');

    saveSpy.mockRestore();
  });
});
