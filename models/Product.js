import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    grade: {
      type: String,
      default: '100% Virgin Polymer',
      trim: true,
    },
    price: {
      type: String,
      required: [true, 'Price is required'],
      trim: true,
    },
    moq: {
      type: String,
      default: 'MOQ 100 pcs',
      trim: true,
    },
    rating: {
      type: String,
      default: '5.0',
    },
    badge: {
      type: String,
      default: '',
    },
    badgeColor: {
      type: String,
      default: 'bg-blue-600',
    },
    image: {
      type: String,
      default: '/hero-products/prod-1.png',
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    stock: {
      type: String,
      enum: ['in-stock', 'low-stock', 'out-of-stock'],
      default: 'in-stock',
    },
    discountPercent: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

// Generate slug before saving if not present
productSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

export default mongoose.model('Product', productSchema);
