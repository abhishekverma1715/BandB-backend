import express from 'express';
import Product from '../models/Product.js';
import Inquiry from '../models/Inquiry.js';
import Category from '../models/Category.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get dashboard metrics & counters
// @route   GET /api/dashboard/stats
// @access  Private (Admin)
router.get('/stats', protect, async (req, res) => {
  try {
    const [totalProducts, totalInquiries, newInquiries, inProgressInquiries, lowStock, totalCategories] =
      await Promise.all([
        Product.countDocuments(),
        Inquiry.countDocuments(),
        Inquiry.countDocuments({ status: 'new' }),
        Inquiry.countDocuments({ status: 'in-progress' }),
        Product.countDocuments({ stock: { $in: ['low-stock', 'out-of-stock'] } }),
        Category.countDocuments(),
      ]);

    const recentInquiries = await Inquiry.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      totalProducts,
      totalInquiries,
      newInquiries,
      inProgressInquiries,
      lowStock,
      totalCategories,
      recentInquiries,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
