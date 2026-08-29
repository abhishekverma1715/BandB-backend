import mongoose from 'mongoose';
import { beforeAll, afterAll, vi } from 'vitest';

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test-db';

vi.mock('./config/db.js', () => ({
  connectDB: vi.fn(),
}));

// Avoid Mongoose OverwriteModelError
beforeAll(() => {
  if (mongoose.connection.readyState !== 0) {
    mongoose.models = {};
  }
});
