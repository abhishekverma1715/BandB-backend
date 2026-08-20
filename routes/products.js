import express from 'express';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all products (public/admin)
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, stock, search } = req.query;
    let filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (stock && stock !== 'All') {
      filter.stock = stock;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { grade: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @desc    Get single product by slug or ID
// @route   GET /api/products/:slugOrId
// @access  Public
router.get('/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    let product = null;

    if (slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(slugOrId);
    }

    if (!product) {
      product = await Product.findOne({ slug: slugOrId });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found in catalog.' });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin)
router.post('/', protect, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Toggle product stock status
// @route   PATCH /api/products/:id/stock
// @access  Private (Admin)
router.patch('/:id/stock', protect, async (req, res) => {
  try {
    const { stock } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted from catalog' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
