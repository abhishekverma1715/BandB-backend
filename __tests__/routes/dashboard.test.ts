import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../server.ts';
import Admin from '../../models/Admin.ts';
import Product from '../../models/Product.ts';
import Inquiry from '../../models/Inquiry.ts';
import Category from '../../models/Category.ts';
import jwt from 'jsonwebtoken';

describe('Dashboard Routes', () => {
  let token: string;

  beforeEach(async () => {
    // Create an admin and generate a token
    const admin = await Admin.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
    });

    token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return 401 if unauthorized', async () => {
      const response = await request(app).get('/api/dashboard/stats');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return empty stats if database is empty', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        totalProducts: 0,
        unreadInquiries: 0,
        totalInquiries: 0,
        stockAlertsCount: 0,
        totalCategories: 0,
        recentInquiries: [],
        lowStockProducts: [],
      });
    });

    it('should return correct aggregated stats', async () => {
      // Seed Data
      await Category.create([{ name: 'Category 1' }, { name: 'Category 2' }]);

      await Product.create([
        { name: 'Prod 1', category: 'Category 1', price: '10', description: 'desc', stock: 'in-stock' },
        { name: 'Prod 2', category: 'Category 1', price: '10', description: 'desc', stock: 'low-stock' },
        { name: 'Prod 3', category: 'Category 2', price: '10', description: 'desc', stock: 'out-of-stock' },
      ]);

      await Inquiry.create([
        { name: 'John', email: 'j@t.com', phone: '123', subject: 'sub', message: 'msg', privacy: true, status: 'new' },
        { name: 'Jane', email: 'ja@t.com', phone: '123', subject: 'sub', message: 'msg', privacy: true, status: 'resolved' },
      ]);

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const stats = response.body.data;
      expect(stats.totalProducts).toBe(3);
      expect(stats.unreadInquiries).toBe(1); // Only 'new'
      expect(stats.totalInquiries).toBe(2);
      expect(stats.stockAlertsCount).toBe(2); // 'low-stock' and 'out-of-stock'
      expect(stats.totalCategories).toBe(2);
      expect(stats.recentInquiries).toHaveLength(2);
      expect(stats.lowStockProducts).toHaveLength(2);
    });

    it('should handle errors gracefully', async () => {
      // Temporarily monkey patch Product.countDocuments to throw an error
      const originalCountDocs = Product.countDocuments;
      Product.countDocuments = vi.fn().mockRejectedValue(new Error('DB Error')) as any;

      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('DB Error');

      // Restore
      Product.countDocuments = originalCountDocs;
    });
  });
});
