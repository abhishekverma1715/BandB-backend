import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, default: 'Admin' },
  createdAt: { type: Date, default: Date.now },
});

const inquirySchema = new mongoose.Schema(
  {
    inquiryId: {
      type: String,
      unique: true,
      trim: true,
      default: () => `INQ-${Math.floor(1000 + Math.random() * 9000)}`,
    },
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    company: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Client email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    subject: {
      type: String,
      default: 'Wholesale RFQ Inquiry',
      trim: true,
    },
    product: {
      type: String,
      default: '',
      trim: true,
    },
    quantity: {
      type: String,
      default: '',
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Inquiry message is required'],
    },
    newsletter: {
      type: Boolean,
      default: false,
    },
    privacy: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved', 'archived'],
      default: 'new',
    },
    notes: [noteSchema],
  },
  { timestamps: true }
);

// Auto-generate inquiryId before save
inquirySchema.pre('save', function (next) {
  if (!this.inquiryId) {
    this.inquiryId = `INQ-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

export default mongoose.model('Inquiry', inquirySchema);
