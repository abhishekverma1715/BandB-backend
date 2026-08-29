import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import dns from 'dns';
import mongoose from 'mongoose';

// We must use module mock before importing the module we want to test
vi.mock('dns', () => ({
  default: {
    setServers: vi.fn(),
    setDefaultResultOrder: vi.fn(),
  },
}));

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));

describe('config/db.ts', () => {
  let connectDB: () => Promise<void>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Mock process.exit and console methods
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Dynamic import to test top-level code execution and isolate tests
    const dbModule = await import('./db');
    connectDB = dbModule.connectDB;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DNS configuration', () => {
    it('should configure DNS servers and default result order on import', async () => {
      expect(dns.setServers).toHaveBeenCalledWith(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
      expect(dns.setDefaultResultOrder).toHaveBeenCalledWith('ipv4first');
    });

    it('should gracefully handle errors if dns functions fail', async () => {
      // Mock dns to throw an error
      vi.mocked(dns.setServers).mockImplementationOnce(() => {
        throw new Error('DNS Error');
      });

      // Need to re-import because the module has already been imported
      vi.resetModules();

      // If it throws, the test would fail here without the try/catch in db.ts
      const dbModule = await import('./db');
      expect(dbModule).toBeDefined();
    });
  });

  describe('connectDB', () => {
    it('should connect to MongoDB successfully and log the connection', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      const mockConnection = { connection: { host: 'localhost' } };
      vi.mocked(mongoose.connect).mockResolvedValueOnce(mockConnection as any);

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test');
      expect(console.log).toHaveBeenCalledWith('✅ MongoDB Connected: localhost');
      expect(console.error).not.toHaveBeenCalled();
      expect(process.exit).not.toHaveBeenCalled();
    });

    it('should handle connection errors, log the error, and exit the process', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      const mockError = new Error('Connection failed');
      vi.mocked(mongoose.connect).mockRejectedValueOnce(mockError);

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test');
      expect(console.error).toHaveBeenCalledWith('❌ MongoDB Connection Error:', mockError);
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(console.log).not.toHaveBeenCalled();
    });
  });
});
