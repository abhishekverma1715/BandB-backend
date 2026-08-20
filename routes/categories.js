import express from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all categories with live product count
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    // Populate dynamic product counts
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat.name });
        return {
          _id: cat._id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          productCount: count,
        };
      })
    );

    res.json(categoriesWithCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin)
router.post('/', protect, async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true, message: 'Category removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
