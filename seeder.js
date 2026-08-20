import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import Admin from './models/Admin.js';
import Product from './models/Product.js';
import Category from './models/Category.js';
import Inquiry from './models/Inquiry.js';

dotenv.config();

// Fix Windows DNS SRV lookup issues for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  // fallback gracefully
}

const initialCategories = [
  {
    name: 'Heavy-Duty Containers',
    slug: 'heavy-duty-containers',
    description: 'High-density polyethylene storage crates, bins, and industrial transport tubs.',
    icon: 'FiBox',
  },
  {
    name: 'Industrial Molding',
    slug: 'industrial-molding',
    description: 'Custom injection-molded components, modular stands, and racking pallets.',
    icon: 'FiLayers',
  },
  {
    name: 'Food Grade Polymer',
    slug: 'food-grade-polymer',
    description: 'BPA-free Tritan & PP bottles, airtight food storage, and kitchen containers.',
    icon: 'FiCoffee',
  },
  {
    name: 'Child Safety Polymer',
    slug: 'child-safety-polymer',
    description: 'Pediatric seating, ergonomic booster chairs, and certified non-toxic molding.',
    icon: 'FiSmile',
  },
  {
    name: 'Specialty Liquid Container',
    slug: 'specialty-liquid-container',
    description: 'Calibrated measuring buckets, chemical-resistant carboys, and dosing basins.',
    icon: 'FiDroplet',
  },
  {
    name: 'Household & Sanitary',
    slug: 'household-and-sanitary',
    description: 'Durable commercial basins, organizers, sanitary ware, and utility bins.',
    icon: 'FiHome',
  },
];

const initialProducts = [
  {
    name: 'BPA-Free Premium Sports Bottle',
    category: 'Food Grade Polymer',
    grade: '100% Virgin Tritan / PP',
    price: '$12.50 / unit',
    moq: 'MOQ 100 pcs',
    rating: '4.9',
    badge: 'Best Seller',
    badgeColor: 'bg-blue-600',
    image: '/hero-products/prod-1.png',
    slug: 'bpa-free-sports-bottle',
    stock: 'in-stock',
    discountPercent: 22,
    description: 'Leak-proof, impact-resistant hydration bottle molded from food-safe virgin polymer.',
  },
  {
    name: 'Heavy-Duty Modular Industrial Stand',
    category: 'Industrial Molding',
    grade: 'Reinforced High-Impact ABS',
    price: '$45.00 / unit',
    moq: 'MOQ 50 pcs',
    rating: '5.0',
    badge: 'Industrial Grade',
    badgeColor: 'bg-emerald-600',
    image: '/hero-products/prod-2.png',
    slug: 'heavy-duty-modular-stand',
    stock: 'in-stock',
    description: 'Stackable, load-tested industrial rack designed for factory floor and warehouse storage.',
  },
  {
    name: 'Ergonomic Baby Booster Chair',
    category: 'Child Safety Polymer',
    grade: 'Non-Toxic Virgin PP/ABS',
    price: '$28.00 / unit',
    moq: 'MOQ 100 pcs',
    rating: '4.8',
    badge: 'Certified Safe',
    badgeColor: 'bg-amber-600',
    image: '/hero-products/prod-3.png',
    slug: 'ergonomic-baby-booster-chair',
    stock: 'low-stock',
    discountPercent: 12,
    description: 'Safety-certified pediatric seating solution with rounded anti-pinch edges.',
  },
  {
    name: 'Industrial Storage & Logistics Crate',
    category: 'Heavy-Duty Containers',
    grade: 'High-Density Polyethylene (HDPE)',
    price: '$18.00 / unit',
    moq: 'MOQ 200 pcs',
    rating: '4.9',
    badge: 'High Durability',
    badgeColor: 'bg-purple-600',
    image: '/hero-products/prod-4.png',
    slug: 'industrial-storage-crate',
    stock: 'in-stock',
    description: 'Stackable heavy-duty crate with interlocking corners built for automated logistics handling.',
  },
  {
    name: 'Heavy-Duty Polymer Container 50L',
    category: 'Heavy-Duty Containers',
    grade: '100% Virgin HDPE Granules',
    price: '$32.50 / unit',
    moq: 'MOQ 150 pcs',
    rating: '4.9',
    badge: 'Reinforced Ribs',
    badgeColor: 'bg-indigo-600',
    image: '/hero-products/prod-5.png',
    slug: 'heavy-duty-polymer-container',
    stock: 'in-stock',
    discountPercent: 18,
    description: 'High-capacity storage tub with reinforced structural ribbing for maximum load weight.',
  },
  {
    name: 'Commercial Utility Basin 35L',
    category: 'Heavy-Duty Containers',
    grade: 'Ultra-Grip Polymer Blend',
    price: '$14.00 / unit',
    moq: 'MOQ 100 pcs',
    rating: '4.7',
    badge: 'Chemical Resistant',
    badgeColor: 'bg-teal-600',
    image: '/hero-products/prod-6.png',
    slug: 'commercial-utility-basin',
    stock: 'in-stock',
    description: 'Chemical-resistant commercial washing and storage basin for harsh environments.',
  },
  {
    name: 'Precision Measuring Bucket 20L',
    category: 'Specialty Liquid Container',
    grade: 'Food & Industrial Grade HDPE',
    price: '$9.00 / unit',
    moq: 'MOQ 250 pcs',
    rating: '4.8',
    badge: 'Calibrated Scale',
    badgeColor: 'bg-cyan-600',
    image: '/hero-products/prod-7.png',
    slug: 'precision-measuring-bucket-20l',
    stock: 'low-stock',
    description: 'Graduated measurement bucket with chemical volume indicators and pouring spout.',
  },
];

const initialInquiries = [
  {
    inquiryId: 'INQ-1001',
    name: 'Rajesh Sharma',
    company: 'Apex Chemical Logistics Ltd',
    email: 'r.sharma@apexchem.in',
    phone: '+91 98201 44521',
    subject: 'Bulk Quote for 50L Heavy-Duty Chemical Containers',
    product: 'Heavy-Duty Polymer Container 50L',
    quantity: '1,500 units',
    message: 'We require 1,500 units of 50L chemical-resistant containers with custom hazardous material label embossing and UN certification docs for Q3 dispatch.',
    status: 'new',
    notes: [
      { text: 'Assigned to North Zone sales desk.', author: 'Admin' }
    ]
  },
  {
    inquiryId: 'INQ-1002',
    name: 'Elena Rostova',
    company: 'Vanguard Global Exports',
    email: 'elena.rostova@vanguard-trade.eu',
    phone: '+44 20 7946 0912',
    subject: 'FOB Pricing for Industrial Storage & Logistics Crate',
    product: 'Industrial Storage & Logistics Crate',
    quantity: '5,000 units (40ft High Cube Container)',
    message: 'Looking for factory-direct FOB Mumbai quotes for stackable crates. We need Euro-pallet compatible footprints with custom blue colorway.',
    status: 'in-progress',
    notes: [
      { text: 'Shared FOB pricing breakdown for 40ft HQ container.', author: 'Admin' }
    ]
  }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing data & stale indexes
    await Admin.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Inquiry.deleteMany();

    try {
      await Product.collection.dropIndexes();
      await Inquiry.collection.dropIndexes();
      await Category.collection.dropIndexes();
    } catch (e) {
      // ignore if indexes don't exist
    }

    // Create Super Admin (manishverma123@gmail.com / Mahi@742)
    await Admin.create({
      name: 'Super Admin',
      email: 'manishverma123@gmail.com',
      password: 'Mahi@742',
      role: 'Super Admin',
    });
    console.log('👑 Admin user created: manishverma123@gmail.com');

    // Create Categories
    await Category.insertMany(initialCategories);
    console.log(`📁 ${initialCategories.length} Categories seeded`);

    // Create Products
    await Product.insertMany(initialProducts);
    console.log(`📦 ${initialProducts.length} Products seeded`);

    // Create Inquiries
    await Inquiry.insertMany(initialInquiries);
    console.log(`✉️ ${initialInquiries.length} Inquiries seeded`);

    console.log('🎉 Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seedData();
