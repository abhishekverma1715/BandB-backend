import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = express.Router();

// Helper to query product by MongoDB _id OR slug
const getProductQuery = (idParam: string) => {
  if (!idParam) return { _id: null };
  if (mongoose.isValidObjectId(idParam)) {
    return { $or: [{ _id: new mongoose.Types.ObjectId(idParam) }, { slug: idParam }] };
  }
  return { slug: idParam };
};

// Zod Validation Schemas
const productSchemaZod = z.object({
  name: z.string().min(2, 'Product name is required'),
  category: z.string().min(2, 'Category is required'),
  grade: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  moq: z.string().optional(),
  rating: z.string().optional(),
  badge: z.string().optional(),
  badgeColor: z.string().optional(),
  image: z.string().optional(),
  slug: z.string().optional(),
  stock: z.enum(['in-stock', 'low-stock', 'out-of-stock']).default('in-stock'),
  discountPercent: z.number().nullable().optional(),
  description: z.string().min(5, 'Description is required'),
  specifications: z.record(z.string(), z.string()).optional(),
});

const stockToggleSchemaZod = z.object({
  stock: z.enum(['in-stock', 'low-stock', 'out-of-stock']),
});

// @desc    Get all products (public/admin)
// @route   GET /api/products
// @access  Public
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, stock, search } = req.query;
    const filter: Record<string, any> = {};

    if (category && category !== 'All') {
      filter.category = String(category);
    }

    if (stock && stock !== 'All') {
      filter.stock = String(stock);
    }

    if (search) {
      const q = String(search).trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { grade: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// @desc    Get single product by slug or ID
// @route   GET /api/products/:slugOrId
// @access  Public
router.get('/:slugOrId', async (req: Request, res: Response): Promise<void> => {
  try {
    const slugOrId = String(req.params.slugOrId);
    let product = null;

    if (mongoose.isValidObjectId(slugOrId)) {
      product = await Product.findById(slugOrId).lean();
    }

    if (!product) {
      product = await Product.findOne({ slug: slugOrId }).lean();
    }

    if (!product) {
      res.status(404).json({ error: 'Product not found in catalog.' });
      return;
    }

    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin)
router.post('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = productSchemaZod.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid product payload',
      });
      return;
    }

    const product = await Product.create(parseResult.data);
    res.status(201).json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin)
router.put('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = productSchemaZod.partial().safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid product update payload',
      });
      return;
    }

    const query = getProductQuery(String(req.params.id));
    const product = await Product.findOneAndUpdate(query, parseResult.data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Toggle product stock status
// @route   PATCH /api/products/:id/stock
// @access  Private (Admin)
router.patch('/:id/stock', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = stockToggleSchemaZod.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid stock level. Must be in-stock, low-stock, or out-of-stock.',
      });
      return;
    }

    const query = getProductQuery(String(req.params.id));
    const product = await Product.findOneAndUpdate(
      query,
      { stock: parseResult.data.stock },
      { new: true }
    ).lean();

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
router.delete('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = getProductQuery(String(req.params.id));
    const product = await Product.findOneAndDelete(query).lean();

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ success: true, message: 'Product deleted from catalog' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
