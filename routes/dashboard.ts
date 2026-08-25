import express, { Response } from 'express';
import Product from '../models/Product.js';
import Inquiry from '../models/Inquiry.js';
import Category from '../models/Category.js';
import { protect } from '../middleware/auth.js';
import { AuthRequest, IDashboardStats } from '../types/index.js';

const router = express.Router();

// @desc    Get aggregated dashboard stats for Admin command center
// @route   GET /api/dashboard/stats
// @access  Private (Admin)
router.get('/stats', protect, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalProducts,
      unreadInquiries,
      totalInquiries,
      stockAlertsCount,
      totalCategories,
      recentInquiries,
      lowStockProducts,
    ] = await Promise.all([
      Product.countDocuments(),
      Inquiry.countDocuments({ status: 'new' }),
      Inquiry.countDocuments(),
      Product.countDocuments({ stock: { $in: ['low-stock', 'out-of-stock'] } }),
      Category.countDocuments(),
      Inquiry.find().sort({ createdAt: -1 }).limit(5).lean(),
      Product.find({ stock: { $in: ['low-stock', 'out-of-stock'] } })
        .limit(6)
        .lean(),
    ]);

    const stats: IDashboardStats = {
      totalProducts,
      unreadInquiries,
      totalInquiries,
      stockAlertsCount,
      totalCategories,
      recentInquiries: recentInquiries as any,
      lowStockProducts: lowStockProducts as any,
    };

    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
