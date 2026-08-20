import express from 'express';
import Inquiry from '../models/Inquiry.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all inquiries (with search & status filtering)
// @route   GET /api/inquiries
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
  try {
    const { status, search } = req.query;
    let filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { product: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @desc    Submit public inquiry from website
// @route   POST /api/inquiries
// @access  Public
router.post('/', async (req, res) => {
  try {
    const inquiry = await Inquiry.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Inquiry received successfully. Our factory sales desk will contact you.',
      inquiry,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Update inquiry status
// @route   PATCH /api/inquiries/:id/status
// @access  Private (Admin)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    res.json(inquiry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Add admin internal note
// @route   POST /api/inquiries/:id/notes
// @access  Private (Admin)
router.post('/:id/notes', protect, async (req, res) => {
  try {
    const { text, author } = req.body;
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    inquiry.notes.push({
      text,
      author: author || req.admin?.name || 'Admin',
      createdAt: new Date(),
    });

    await inquiry.save();
    res.status(201).json(inquiry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @desc    Delete inquiry record
// @route   DELETE /api/inquiries/:id
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    res.json({ success: true, message: 'Inquiry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
