import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import authRoutes from '../../routes/auth';
import Admin from '../../models/Admin';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server error',
  });
});

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Admin.deleteMany({});
});

describe('Auth Routes - Seed Admin Fallback', () => {
  it('should authenticate default seed admin and create it in DB when credentials match fallback', async () => {
    // Ensure the database is fresh and there is no admin
    const adminCount = await Admin.countDocuments();
    expect(adminCount).toBe(0);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'manishverma123@gmail.com',
        password: 'Mahi@742'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.email).toBe('manishverma123@gmail.com');
    expect(res.body.token).toBeDefined();

    // Verify it was actually created in DB
    const newAdminCount = await Admin.countDocuments();
    expect(newAdminCount).toBe(1);

    const createdAdmin = await Admin.findOne({ email: 'manishverma123@gmail.com' });
    expect(createdAdmin).not.toBeNull();
  });

  it('should reject incorrect seed admin credentials', async () => {
    // Try with wrong password for seed admin
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'manishverma123@gmail.com',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid administrator credentials.');
  });
});
