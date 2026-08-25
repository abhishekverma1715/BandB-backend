import mongoose, { Schema } from 'mongoose';
import { IInquiry, IInquiryNote } from '../types/index.js';

const noteSchema = new Schema<IInquiryNote>(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      default: 'Admin',
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const inquirySchema = new Schema<IInquiry>(
  {
    inquiryId: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
    },
    company: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    product: {
      type: String,
      default: '',
      trim: true,
    },
    quantity: {
      type: String,
      default: 'Wholesale RFQ',
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Requirement message is required'],
    },
    newsletter: {
      type: Boolean,
      default: false,
    },
    privacy: {
      type: Boolean,
      required: [true, 'Privacy agreement is required'],
      default: true,
    },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved', 'archived'],
      default: 'new',
      index: true,
    },
    notes: [noteSchema],
  },
  { timestamps: true }
);

// Indexes for rapid inquiry triage and lookup
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ name: 'text', company: 'text', subject: 'text', email: 'text' });

// Auto-generate INQ-xxxx inquiryId before saving
inquirySchema.pre('save', async function (next) {
  if (!this.inquiryId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.inquiryId = `INQ-${randomSuffix}`;
  }
  next();
});

export default mongoose.model<IInquiry>('Inquiry', inquirySchema);
