import express from 'express';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import authRoutes from './auth.js';
import Admin from '../models/Admin.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

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
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

describe('Auth Routes', () => {
  // Set required JWT secret for tests
  process.env.JWT_SECRET = 'test-jwt-secret-key';

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await Admin.create({
        name: 'Test Admin',
        email: 'testadmin@example.com',
        password: 'securepassword',
        role: 'Super Admin',
      });
    });

    it('should login successfully with existing user credentials and return token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testadmin@example.com',
          password: 'securepassword'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.email).toBe('testadmin@example.com');
    });

    it('should login successfully with default seed credentials when db is fresh', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'manishverma123@gmail.com',
          password: 'Mahi@742'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should fail with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testadmin@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid administrator credentials.');
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('expected string, received undefined');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear the token cookie', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify cookie is cleared
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(setCookie[0]).toContain('token=;');
    });
  });

  describe('Private Routes (/me, /profile, /password)', () => {
    let token: string;
    let seedAdminId: string;

    beforeEach(async () => {
      // Login first to get the token for protected routes
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'manishverma123@gmail.com',
          password: 'Mahi@742'
        });

      token = res.body.token;
      seedAdminId = res.body._id;
    });

    describe('GET /api/auth/me', () => {
      it('should return admin profile if authorized', async () => {
        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe('manishverma123@gmail.com');
      });

      it('should fail if no token provided', async () => {
        const res = await request(app).get('/api/auth/me');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });

    describe('PUT /api/auth/profile', () => {
      it('should update profile name', async () => {
        const res = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'Updated Admin Name',
            email: 'manishverma123@gmail.com'
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.name).toBe('Updated Admin Name');

        const updatedAdmin = await Admin.findById(seedAdminId);
        expect(updatedAdmin?.name).toBe('Updated Admin Name');
      });

      it('should fail with invalid email', async () => {
        const res = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'Admin Name',
            email: 'not-an-email'
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('PUT /api/auth/password', () => {
      it('should update password successfully', async () => {
        const res = await request(app)
          .put('/api/auth/password')
          .set('Authorization', `Bearer ${token}`)
          .send({
            currentPassword: 'Mahi@742',
            newPassword: 'newsecurepassword'
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify can login with new password
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'manishverma123@gmail.com',
            password: 'newsecurepassword'
          });

        expect(loginRes.status).toBe(200);
      });

      it('should fail with incorrect current password', async () => {
        const res = await request(app)
          .put('/api/auth/password')
          .set('Authorization', `Bearer ${token}`)
          .send({
            currentPassword: 'wrongpassword',
            newPassword: 'newsecurepassword'
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Current password is incorrect.');
      });
    });
  });
});
