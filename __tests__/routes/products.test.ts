import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import productRoutes from '../../routes/products.js';
import Product from '../../models/Product.js';

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

// Mock the Product model
vi.mock('../../models/Product.js', () => {
  return {
    default: {
      findById: vi.fn(),
      findOne: vi.fn(),
    }
  };
});

describe('Product Routes - GET /api/products/:slugOrId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/products/:slugOrId', () => {
    it('should handle errors thrown by database when finding by ID', async () => {
      // Arrange: mock findById to throw an error
      const mockError = new Error('Database connection failed');
      vi.mocked(Product.findById).mockReturnValue({
        lean: vi.fn().mockRejectedValue(mockError),
      } as any);

      // Valid ObjectId
      const validObjectId = new mongoose.Types.ObjectId().toString();

      // Act
      const response = await request(app).get(`/api/products/${validObjectId}`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: mockError.message });
      expect(Product.findById).toHaveBeenCalledWith(validObjectId);
    });

    it('should handle errors thrown by database when finding by slug', async () => {
      // Arrange: mock findOne to throw an error
      const mockError = new Error('Database timeout');
      const slug = 'some-product-slug';
      vi.mocked(Product.findOne).mockReturnValue({
        lean: vi.fn().mockRejectedValue(mockError),
      } as any);

      // Act
      const response = await request(app).get(`/api/products/${slug}`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: mockError.message });
      expect(Product.findOne).toHaveBeenCalledWith({ slug });
    });

    it('should return a product by ID', async () => {
      const mockProduct = {
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'Test Product',
        slug: 'test-product',
      };

      vi.mocked(Product.findById).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockProduct),
      } as any);

      const response = await request(app).get(`/api/products/${mockProduct._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProduct);
      expect(Product.findById).toHaveBeenCalledWith(mockProduct._id);
    });

    it('should return a product by slug', async () => {
      const mockProduct = {
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'Test Product',
        slug: 'test-product',
      };

      const slug = 'test-product';

      vi.mocked(Product.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockProduct),
      } as any);

      const response = await request(app).get(`/api/products/${slug}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProduct);
      expect(Product.findOne).toHaveBeenCalledWith({ slug });
    });

    it('should return 404 if product is not found', async () => {
      const slug = 'non-existent-product';

      vi.mocked(Product.findOne).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      const response = await request(app).get(`/api/products/${slug}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Product not found in catalog.' });
    });
  });
});
