import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router: express.Router = express.Router();

// Helper to query category by MongoDB _id OR slug
const getCategoryQuery = (idParam: string) => {
  if (!idParam) return { _id: null };
  if (mongoose.isValidObjectId(idParam)) {
    return { $or: [{ _id: new mongoose.Types.ObjectId(idParam) }, { slug: idParam }] };
  }
  return { slug: idParam };
};

const categorySchemaZod = z.object({
  name: z.string().min(2, 'Category name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
});

// @desc    Get all categories with live product count
// @route   GET /api/categories
// @access  Public
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    // ⚡ Bolt Optimization: Replace N+1 query with single aggregation
    // Old: N queries (Product.countDocuments inside map)
    // New: 2 queries (Find categories + Aggregate product counts)
    // Impact: Eliminates N database calls, making category fetch O(1) queries instead of O(N).

    const categories = await Category.find().sort({ name: 1 }).lean();

    // Batch aggregate product counts by category in one query
    const productCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Create O(1) lookup map for fast in-memory matching
    const countsMap = new Map(productCounts.map(pc => [pc._id, pc.count]));

    // Populate dynamic product counts from memory
    const categoriesWithCount = categories.map((cat) => ({
      _id: cat._id,
      id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      productCount: countsMap.get(cat.name) || 0,
    }));

    res.json(categoriesWithCount);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin)
router.post('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = categorySchemaZod.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Category validation failed',
      });
      return;
    }

    const category = await Category.create(parseResult.data);
    res.status(201).json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
router.put('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = categorySchemaZod.partial().safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Category update validation failed',
      });
      return;
    }

    const query = getCategoryQuery(String(req.params.id));
    const existingCategory = await Category.findOne(query);

    if (!existingCategory) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const oldName = existingCategory.name;
    const newName = parseResult.data.name?.trim();

    const category = await Category.findOneAndUpdate(query, parseResult.data, {
      new: true,
      runValidators: true,
    }).lean();

    // If category name was updated, cascade change to all assigned products
    if (newName && oldName && oldName !== newName) {
      await Product.updateMany({ category: oldName }, { category: newName });
    }

    res.json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
router.delete('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = getCategoryQuery(String(req.params.id));
    const category = await Category.findOneAndDelete(query).lean();

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({ success: true, message: 'Category removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
