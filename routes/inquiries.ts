import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Inquiry from '../models/Inquiry.js';
import { protect } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { buildQueryByIdOrField } from '../utils/queryHelpers.js';

const router = express.Router();

// Zod Validation Schemas
const submitInquirySchemaZod = z.object({
  name: z.string().min(2, 'Full name is required'),
  company: z.string().optional(),
  email: z.string().email('Valid email address is required'),
  phone: z.string().min(6, 'Valid phone number is required'),
  subject: z.string().min(2, 'Subject is required'),
  product: z.string().optional(),
  quantity: z.string().optional(),
  message: z.string().min(5, 'Message details required'),
  newsletter: z.boolean().optional().default(false),
  privacy: z.boolean().optional().default(true),
});

const statusUpdateSchemaZod = z.object({
  status: z.enum(['new', 'in-progress', 'resolved', 'archived']),
});

const noteSchemaZod = z.object({
  text: z.string().min(1, 'Note content cannot be empty'),
  author: z.string().optional().default('Admin'),
});

// @desc    Submit new quotation inquiry
// @route   POST /api/inquiries
// @access  Public
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = submitInquirySchemaZod.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || 'Invalid form submission data',
      });
      return;
    }

    const inquiry = await Inquiry.create(parseResult.data);

    res.status(201).json({
      success: true,
      message: 'Inquiry received successfully. Our factory sales desk will contact you.',
      inquiry,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// @desc    Get all inquiries (with optional status & keyword filters)
// @route   GET /api/inquiries
// @access  Private (Admin)
router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const filter: Record<string, any> = {};

    if (status && status !== 'all') {
      filter.status = String(status);
    }

    if (search) {
      const q = String(search).trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { inquiryId: { $regex: q, $options: 'i' } },
        { product: { $regex: q, $options: 'i' } },
      ];
    }

    const inquiries = await Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json(inquiries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// @desc    Get single inquiry details
// @route   GET /api/inquiries/:id
// @access  Private (Admin)
router.get('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = buildQueryByIdOrField(String(req.params.id), 'inquiryId');
    const inquiry = await Inquiry.findOne(query).lean();

    if (!inquiry) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }

    res.json(inquiry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// @desc    Update inquiry status
// @route   PATCH /api/inquiries/:id/status
// @access  Private (Admin)
router.patch('/:id/status', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = statusUpdateSchemaZod.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid status. Must be new, in-progress, resolved, or archived.',
      });
      return;
    }

    const query = buildQueryByIdOrField(String(req.params.id), 'inquiryId');
    const inquiry = await Inquiry.findOneAndUpdate(
      query,
      { status: parseResult.data.status },
      { new: true }
    ).lean();

    if (!inquiry) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }

    res.json(inquiry);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Add admin note to inquiry
// @route   POST /api/inquiries/:id/notes
// @access  Private (Admin)
router.post('/:id/notes', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parseResult = noteSchemaZod.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Note content required',
      });
      return;
    }

    const query = buildQueryByIdOrField(String(req.params.id), 'inquiryId');
    const inquiry = await Inquiry.findOne(query);

    if (!inquiry) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }

    inquiry.notes.unshift({
      text: parseResult.data.text.trim(),
      author: parseResult.data.author || req.adminEmail || 'Super Admin',
      createdAt: new Date(),
    });

    await inquiry.save();
    res.status(201).json(inquiry);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Delete inquiry
// @route   DELETE /api/inquiries/:id
// @access  Private (Admin)
router.delete('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = buildQueryByIdOrField(String(req.params.id), 'inquiryId');
    const inquiry = await Inquiry.findOneAndDelete(query).lean();

    if (!inquiry) {
      res.status(404).json({ error: 'Inquiry not found' });
      return;
    }

    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// @desc    Bulk wipe all inquiries (Admin Maintenance)
// @route   DELETE /api/inquiries/clear/all
// @access  Private (Admin)
router.delete('/clear/all', protect, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Inquiry.deleteMany({});
    res.json({ success: true, message: 'All inquiry records permanently cleared' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
