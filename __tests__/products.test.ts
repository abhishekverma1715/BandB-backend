import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import Admin from '../models/Admin.js';
import Product from '../models/Product.js';
import jwt from 'jsonwebtoken';

let mongoServer: MongoMemoryServer;
let app: any;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test-secret';

  const module = await import('../server.ts');
  app = module.default;
  app = module.default;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Product.deleteMany({});
  await Admin.deleteMany({});
});

describe('Products Routes', () => {
  let token: string;
  let adminId: mongoose.Types.ObjectId;
  let adminObj: any;

  beforeEach(async () => {
    adminObj = await Admin.create({
      name: 'Test Admin',
      email: 'test@admin.com',
      password: 'password123',
      role: 'Super Admin'
    });
    adminId = adminObj._id;
    token = jwt.sign({ id: adminId }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
  });

  describe('GET /api/products', () => {
    it('should get all products', async () => {
      await Product.create({
        name: 'Test Product',
        category: 'Test Category',
        price: '100',
        description: 'Test Description'
      });

      const response = await request(app).get('/api/products');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Test Product');
    });

    it('should filter products by category', async () => {
      await Product.create([
        { name: 'Prod A', category: 'Cat1', price: '10', description: 'desc' },
        { name: 'Prod B', category: 'Cat2', price: '20', description: 'desc' }
      ]);
      const response = await request(app).get('/api/products?category=Cat1');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Prod A');
    });

    it('should filter products by search query', async () => {
      await Product.create([
        { name: 'Prod A', category: 'Cat1', price: '10', description: 'apple' },
        { name: 'Prod B', category: 'Cat2', price: '20', description: 'banana' }
      ]);
      const response = await request(app).get('/api/products?search=apple');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Prod A');
    });
  });

  describe('GET /api/products/:slugOrId', () => {
    it('should get product by ID', async () => {
      const p = await Product.create({
        name: 'Test Product',
        category: 'Test',
        price: '100',
        description: 'Description 123'
      });
      const response = await request(app).get(`/api/products/${p._id}`);
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Product');
    });

    it('should get product by slug', async () => {
      const p = await Product.create({
        name: 'Test Product',
        category: 'Test',
        price: '100',
        description: 'Description 123',
        slug: 'test-product'
      });
      const response = await request(app).get(`/api/products/${p.slug}`);
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app).get(`/api/products/nonexistent`);
      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/products', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/products').send({});
      expect(response.status).toBe(401);
    });

    it('should create product when valid payload provided', async () => {
      const p = {
        name: 'New Product',
        category: 'Cat',
        price: '500',
        description: 'Description 123'
      };
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(p);
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Product');
    });

    it('should fail with 400 on invalid payload', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product', async () => {
      const p = await Product.create({
        name: 'Test',
        category: 'Cat',
        price: '10',
        description: 'Description 123'
      });
      const response = await request(app)
        .put(`/api/products/${p._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });

    it('should return 404 if product not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });
      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/products/:id/stock', () => {
    it('should update stock status', async () => {
      const p = await Product.create({
        name: 'Test',
        category: 'Cat',
        price: '10',
        description: 'Description 123',
        stock: 'in-stock'
      });
      const response = await request(app)
        .patch(`/api/products/${p._id}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({ stock: 'out-of-stock' });
      expect(response.status).toBe(200);
      expect(response.body.stock).toBe('out-of-stock');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      const p = await Product.create({
        name: 'Test',
        category: 'Cat',
        price: '10',
        description: 'Description 123'
      });
      const response = await request(app)
        .delete(`/api/products/${p._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const check = await Product.findById(p._id);
      expect(check).toBeNull();
    });
  });
});
