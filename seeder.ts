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
} catch {
  // fallback gracefully
}

const initialCategories = [
  {
    name: 'Heavy-Duty Containers',
    slug: 'heavy-duty-containers',
    description: 'High-density polyethylene storage pails, chemical drums, and industrial transport basins.',
    icon: 'FiBox',
  },
  {
    name: 'Kitchen & Storage Racks',
    slug: 'kitchen-and-storage-racks',
    description: 'Modular multi-tier shelving stands, fruit-vegetable trolleys, and corner bathroom organizers.',
    icon: 'FiGrid',
  },
  {
    name: 'Household & Sanitary',
    slug: 'household-and-sanitary',
    description: 'Embossed bath mugs, utility washing tubs, laundry basins, and decorative planter pots.',
    icon: 'FiHome',
  },
  {
    name: 'Industrial & Agricultural Molding',
    slug: 'industrial-and-agricultural-molding',
    description: 'Perforated farm harvest crates, appliance anti-vibration stands, and heavy logistics tubs.',
    icon: 'FiLayers',
  },
  {
    name: 'Furniture & Seating',
    slug: 'furniture-and-seating',
    description: 'High-strength monobloc dining chairs, banquet seating, and luxury rattan-weave armless chairs.',
    icon: 'FiCheckSquare',
  },
  {
    name: 'Child Safety Polymer',
    slug: 'child-safety-polymer',
    description: 'Pediatric study desks, ergonomic toddler feeding chairs, and certified non-toxic molding.',
    icon: 'FiSmile',
  },
  {
    name: 'Food Grade Polymer',
    slug: 'food-grade-polymer',
    description: 'Unbreakable coffee & tea mug sets, BPA-free food canisters, and certified dining ware.',
    icon: 'FiCoffee',
  },
];

const initialProducts = [
  {
    name: 'Classic Floral Embossed Bath Mug (1.5L)',
    category: 'Household & Sanitary',
    grade: '100% Virgin Polypropylene (PP)',
    price: '₹38.00 / unit',
    moq: 'MOQ 240 pcs',
    rating: '4.9',
    badge: 'Best Seller',
    badgeColor: 'bg-amber-600',
    image: '/hero-products/prod-1.png',
    slug: 'classic-floral-embossed-bath-mug-1-5l',
    stock: 'in-stock' as const,
    discountPercent: 15,
    description:
      'Elegant 1.5L bath mug molded from premium virgin PP polymer featuring precision floral embossment, smooth non-scratch rim, and an ergonomic comfort handle designed for long-lasting household and hotel utility.',
  },
  {
    name: 'Dual-Tone Glossy Heavy-Duty Bath Mug (1.5L)',
    category: 'Household & Sanitary',
    grade: 'High-Gloss Virgin Polymer PP',
    price: '₹45.00 / unit',
    moq: 'MOQ 200 pcs',
    rating: '4.8',
    badge: 'Premium Finish',
    badgeColor: 'bg-blue-600',
    image: '/hero-products/prod-2.png',
    slug: 'dual-tone-glossy-bath-mug-1-5l',
    stock: 'in-stock' as const,
    discountPercent: 10,
    description:
      'Two-tone dual-injection bathroom mug with high-gloss polished exterior, contrast royal blue rim, reinforced handle joint, and impact-resistant thermal shock tolerance for daily bathroom and sanitary use.',
  },
  {
    name: '3-Tier Diamond-Mesh Modular Storage Rack',
    category: 'Kitchen & Storage Racks',
    grade: 'Reinforced High-Impact Polypropylene',
    price: '₹340.00 / unit',
    moq: 'MOQ 50 pcs',
    rating: '4.9',
    badge: 'Modular Design',
    badgeColor: 'bg-emerald-600',
    image: '/hero-products/prod-3.png',
    slug: '3-tier-diamond-mesh-modular-storage-rack',
    stock: 'in-stock' as const,
    discountPercent: 12,
    description:
      'Versatile 3-tier modular utility shelving stand with diamond lattice ventilation baskets, snap-lock structural pillars, and high load capacity ideal for kitchen vegetables, pantry organization, and office storage.',
  },
  {
    name: 'Heavy-Duty Deep Round Basin / Ghamela (35L)',
    category: 'Heavy-Duty Containers',
    grade: 'High-Density Polyethylene (HDPE)',
    price: '₹165.00 / unit',
    moq: 'MOQ 100 pcs',
    rating: '4.9',
    badge: 'Heavy Duty',
    badgeColor: 'bg-indigo-600',
    image: '/hero-products/prod-4.png',
    slug: 'heavy-duty-deep-round-basin-ghamela-35l',
    stock: 'in-stock' as const,
    discountPercent: null,
    description:
      'Heavy-duty industrial round basin (ghamela) engineered from ultra-tough HDPE with reinforced curled perimeter rim. Crack-resistant under extreme construction, masonry mixing, and agricultural washing tasks.',
  },
  {
    name: 'Heavy-Duty Commercial Utility Basin / Ghamela (50L)',
    category: 'Heavy-Duty Containers',
    grade: '100% Virgin HDPE Granules',
    price: '₹240.00 / unit',
    moq: 'MOQ 80 pcs',
    rating: '5.0',
    badge: 'High Capacity',
    badgeColor: 'bg-purple-600',
    image: '/hero-products/prod-5.png',
    slug: 'heavy-duty-commercial-utility-basin-50l',
    stock: 'in-stock' as const,
    discountPercent: 18,
    description:
      'Extra-capacity 50-litre deep industrial utility tub with reinforced base ribbing and high flexural modulus for heavy-volume water storage, fabric soaking, chemical mixing, and bulk material transport.',
  },
  {
    name: 'Industrial Airtight Packaging Pail (20L White)',
    category: 'Heavy-Duty Containers',
    grade: 'Food & Chemical Grade HDPE',
    price: '₹185.00 / unit',
    moq: 'MOQ 150 pcs',
    rating: '4.8',
    badge: 'Airtight Lock',
    badgeColor: 'bg-cyan-600',
    image: '/hero-products/prod-6.png',
    slug: 'industrial-airtight-packaging-pail-20l-white',
    stock: 'in-stock' as const,
    discountPercent: null,
    description:
      'Standard 20L commercial packaging pail in brilliant white HDPE with hermetic sealing blue lid, tamper-evident tear strip, and ergonomic plastic bail handle for paints, distempers, adhesives, and food pastes.',
  },
  {
    name: 'Heavy-Duty Adjustable Appliance Trolley Stand',
    category: 'Industrial & Agricultural Molding',
    grade: 'Reinforced Structural ABS & Polypropylene',
    price: '₹540.00 / unit',
    moq: 'MOQ 40 pcs',
    rating: '5.0',
    badge: 'Anti-Vibration',
    badgeColor: 'bg-slate-700',
    image: '/hero-products/prod-7.png',
    slug: 'heavy-duty-adjustable-appliance-stand',
    stock: 'in-stock' as const,
    discountPercent: 20,
    description:
      'Heavy-duty universal appliance base with adjustable expandable dimensions, cross-hatched textured corner pads, and high-impact vibration absorption feet designed for washing machines, refrigerators, and dishwashers.',
  },
  {
    name: 'Multi-Tier Modular Storage Shelving System (Assorted)',
    category: 'Kitchen & Storage Racks',
    grade: 'Virgin Injection-Grade Polypropylene',
    price: '₹480.00 / unit',
    moq: 'MOQ 60 pcs',
    rating: '4.9',
    badge: 'Multi-Tier Combo',
    badgeColor: 'bg-teal-600',
    image: '/hero-products/prod-8.png',
    slug: 'multi-tier-modular-storage-shelving-system',
    stock: 'in-stock' as const,
    discountPercent: 15,
    description:
      'Commercial wholesale assortment of 2-tier, 3-tier, and 4-tier stackable ventilated storage racks in aesthetic pastel palettes. Tool-free assembly, high breathability, and mildew-resistant polymer composition.',
  },
  {
    name: '2-Tier Compact Tabletop Organizer Rack',
    category: 'Kitchen & Storage Racks',
    grade: 'High-Strength Virgin PP',
    price: '₹210.00 / unit',
    moq: 'MOQ 100 pcs',
    rating: '4.7',
    badge: 'Compact Size',
    badgeColor: 'bg-pink-600',
    image: '/hero-products/prod-9.png',
    slug: '2-tier-compact-tabletop-organizer-rack',
    stock: 'in-stock' as const,
    discountPercent: null,
    description:
      'Dual-tier space-saving tabletop storage organizer with dual-tone pastel baskets (pink/blue) and sturdy white columns. Ideal for bathroom toiletries, vanity cosmetics, spice jars, and desktop accessories.',
  },
  {
    name: '3-Tier Multipurpose Kitchen Storage Trolley',
    category: 'Kitchen & Storage Racks',
    grade: 'Virgin Polymer Blend',
    price: '₹360.00 / unit',
    moq: 'MOQ 50 pcs',
    rating: '4.8',
    badge: 'Top Rated',
    badgeColor: 'bg-green-600',
    image: '/hero-products/prod-10.png',
    slug: '3-tier-multipurpose-kitchen-storage-trolley',
    stock: 'in-stock' as const,
    discountPercent: 10,
    description:
      'Three-shelf kitchen and vegetable storage rack featuring ventilated slot bottoms for continuous airflow. Built with mint green, soft pink, and deep violet trays to organize onions, potatoes, fruits, and condiments.',
  },
  {
    name: '3-Tier Modular Utility Organizer Stand',
    category: 'Kitchen & Storage Racks',
    grade: 'Engineered Virgin Polypropylene',
    price: '₹350.00 / unit',
    moq: 'MOQ 60 pcs',
    rating: '4.8',
    badge: 'High Stability',
    badgeColor: 'bg-blue-600',
    image: '/hero-products/prod-11.png',
    slug: '3-tier-modular-utility-organizer-stand',
    stock: 'in-stock' as const,
    discountPercent: null,
    description:
      'Triple-level multipurpose utility shelf with sky blue, rose pink, and lime green baskets. Engineered with reinforced corner couplings and drain-through slotted base for moisture prevention.',
  },
  {
    name: '3-Tier Space-Saving Corner Organizer Rack',
    category: 'Kitchen & Storage Racks',
    grade: 'Impact-Resistant Virgin PP',
    price: '₹320.00 / unit',
    moq: 'MOQ 75 pcs',
    rating: '4.9',
    badge: 'Corner Fit',
    badgeColor: 'bg-rose-600',
    image: '/hero-products/prod-12.png',
    slug: '3-tier-space-saving-corner-organizer-rack',
    stock: 'in-stock' as const,
    discountPercent: 14,
    description:
      'Ergonomic 90-degree triangular corner shelf stand designed to utilize unused bathroom and kitchen corner spaces. Features perforated drainage floors, non-slip feet, and moisture-proof plastic construction.',
  },
  {
    name: '5-Tier High-Capacity Multipurpose Storage Tower',
    category: 'Kitchen & Storage Racks',
    grade: 'Heavy-Duty Virgin Polypropylene',
    price: '₹620.00 / unit',
    moq: 'MOQ 40 pcs',
    rating: '5.0',
    badge: 'Mega Capacity',
    badgeColor: 'bg-purple-600',
    image: '/hero-products/prod-13.png',
    slug: '5-tier-high-capacity-storage-tower',
    stock: 'in-stock' as const,
    discountPercent: 20,
    description:
      'Five-level vertical storage tower offering maximum volume efficiency in minimal floor footprint. Multi-color modular trays with heavy-duty load tolerance for retail shops, salons, kitchens, and warehouses.',
  },
  {
    name: 'Perforated Agricultural & Vegetable Harvest Crate',
    category: 'Industrial & Agricultural Molding',
    grade: '100% Virgin Food-Grade HDPE',
    price: '₹290.00 / unit',
    moq: 'MOQ 100 pcs',
    rating: '4.9',
    badge: 'Farm & Cold Storage',
    badgeColor: 'bg-emerald-600',
    image: '/hero-products/prod-14.png',
    slug: 'perforated-agricultural-vegetable-harvest-crate',
    stock: 'in-stock' as const,
    discountPercent: null,
    description:
      'Heavy-duty ventilated harvest crate for tomatoes, vegetables, and fruits. Injection molded with aerodynamic ventilation lattices, built-in hand grips, and interlocking base for secure stackable cold storage transport.',
  },
  {
    name: 'Commercial Swing-Top Sanitation Waste Bin (40L)',
    category: 'Heavy-Duty Containers',
    grade: 'UV-Stabilized Impact PP',
    price: '₹420.00 / unit',
    moq: 'MOQ 50 pcs',
    rating: '4.8',
    badge: 'Hygienic Swing Lid',
    badgeColor: 'bg-blue-700',
    image: '/hero-products/prod-15.png',
    slug: 'commercial-swing-top-sanitation-waste-bin-40l',
    stock: 'in-stock' as const,
    discountPercent: null,
    description:
      '40-litre commercial sanitation dustbin in deep royal blue with balanced swing-dome flap. Seamless inner finish allows easy garbage bag removal and chemical wash sanitization in hotels, clinics, and corporate offices.',
  },
  {
    name: 'UV-Stabilized Indoor & Outdoor Decorative Planter Pot',
    category: 'Household & Sanitary',
    grade: 'UV-Protected Virgin Polymer Resin',
    price: '₹125.00 / unit',
    moq: 'MOQ 120 pcs',
    rating: '4.7',
    badge: 'Weather Resistant',
    badgeColor: 'bg-orange-600',
    image: '/hero-products/prod-16.png',
    slug: 'uv-stabilized-decorative-planter-pot',
    stock: 'in-stock' as const,
    discountPercent: 15,
    description:
      'Terracotta-finish horticultural planter pot engineered with UV stabilizers to prevent color fading and cracking under direct sunlight. Features molded drainage base channels and reinforced top rim.',
  },
  {
    name: 'Ergonomic Kids Multi-Activity Study Desk & Organizer',
    category: 'Child Safety Polymer',
    grade: '100% Non-Toxic Virgin PP / ABS',
    price: '₹1,250.00 / unit',
    moq: 'MOQ 25 pcs',
    rating: '5.0',
    badge: 'Certified Non-Toxic',
    badgeColor: 'bg-amber-600',
    image: '/hero-products/prod-17.png',
    slug: 'ergonomic-kids-study-desk-organizer',
    stock: 'in-stock' as const,
    discountPercent: 18,
    description:
      'Safety-certified pediatric study table molded from virgin food-safe resin with rounded anti-injury corners, twin stationery cups, recessed book tray, and heavy-duty reinforced A-frame structural legs.',
  },
  {
    name: 'Infant & Toddler Safety Feeding Booster Chair',
    category: 'Child Safety Polymer',
    grade: 'Medical-Grade Non-Toxic Virgin PP',
    price: '₹680.00 / unit',
    moq: 'MOQ 40 pcs',
    rating: '4.9',
    badge: 'Child Safety Certified',
    badgeColor: 'bg-pink-600',
    image: '/hero-products/prod-18.png',
    slug: 'infant-toddler-safety-feeding-booster-chair',
    stock: 'in-stock' as const,
    discountPercent: 12,
    description:
      'Ergonomic pediatric booster chair with integrated front safety T-bar barrier, wide stable stance base, and smooth stain-resistant surfaces for daycare centers, restaurants, and domestic dining.',
  },
  {
    name: 'Ergonomic Extra-Large Multi-Utility Tub / Bathtub (60L)',
    category: 'Household & Sanitary',
    grade: '100% Virgin High-Flexibility PP',
    price: '₹380.00 / unit',
    moq: 'MOQ 40 pcs',
    rating: '4.9',
    badge: 'Extra Large',
    badgeColor: 'bg-cyan-600',
    image: '/hero-products/prod-19.png',
    slug: 'ergonomic-extra-large-multi-utility-tub-60l',
    stock: 'in-stock' as const,
    discountPercent: null,
    description:
      'Generous 60-litre capacity multipurpose rectangular bath and laundry tub in aqua teal. Molded ergonomic carry handles, reinforced bottom ribs, and smooth satin interior for ultimate comfort and durability.',
  },
  {
    name: 'Heavy-Duty Monobloc Armless Banquet & Dining Chair',
    category: 'Furniture & Seating',
    grade: 'Reinforced High-Grade Copolymer Polypropylene',
    price: '₹490.00 / unit',
    moq: 'MOQ 50 pcs',
    rating: '4.9',
    badge: '150kg Load Tested',
    badgeColor: 'bg-red-600',
    image: '/hero-products/prod-20.png',
    slug: 'heavy-duty-monobloc-armless-dining-chair',
    stock: 'in-stock' as const,
    discountPercent: 10,
    description:
      'One-piece injection molded armless plastic chair in vibrant crimson red. Engineered with fluted backrest ribs, contoured posture support, anti-splay leg reinforcements, and 150kg tested weight capacity.',
  },
  {
    name: 'Premium Rattan-Weave High-Back Armless Chair',
    category: 'Furniture & Seating',
    grade: 'Virgin Copolymer PP with UV Stabilizers',
    price: '₹560.00 / unit',
    moq: 'MOQ 40 pcs',
    rating: '5.0',
    badge: 'Luxury Rattan Texture',
    badgeColor: 'bg-blue-600',
    image: '/hero-products/prod-21.png',
    slug: 'premium-rattan-weave-high-back-chair',
    stock: 'in-stock' as const,
    discountPercent: 15,
    description:
      'Luxury high-back dining chair featuring embossed rattan weave mesh center, built-in top carry handle cutout, deep seat contouring, and UV resistance for luxury banquets, lawn cafes, and residences.',
  },
  {
    name: 'Industrial Paint & Chemical Packaging Pail (20L Yellow)',
    category: 'Heavy-Duty Containers',
    grade: 'Virgin High-Impact HDPE',
    price: '₹190.00 / unit',
    moq: 'MOQ 150 pcs',
    rating: '4.8',
    badge: 'Chemical Proof',
    badgeColor: 'bg-yellow-600',
    image: '/hero-products/prod-22.png',
    slug: 'industrial-paint-chemical-pail-20l-yellow',
    stock: 'in-stock' as const,
    discountPercent: null,
    description:
      'Heavy-wall 20-litre yellow packaging pail with snap-fit hermetic blue lid and sturdy plastic bail handle. Resistant to solvents, lubricants, oil paints, and agricultural liquids with drop-test certification.',
  },
  {
    name: 'Agro-Chemical & Lubricant Heavy Drum Pail (20L Green)',
    category: 'Heavy-Duty Containers',
    grade: 'High-Density Polymer (HDPE)',
    price: '₹195.00 / unit',
    moq: 'MOQ 150 pcs',
    rating: '4.9',
    badge: 'Leak-Proof Seal',
    badgeColor: 'bg-emerald-700',
    image: '/hero-products/prod-23.png',
    slug: 'agro-chemical-lubricant-heavy-drum-pail-20l-green',
    stock: 'in-stock' as const,
    discountPercent: null,
    description:
      'Emerald green 20L heavy-duty container bucket with contrasting safety yellow sealing cap. Precision gasket seal prevents leakage during bumpy rural transport and harsh chemical warehousing.',
  },
  {
    name: 'Heavy Industrial Lubricant & Grease Pail (20L Red)',
    category: 'Heavy-Duty Containers',
    grade: 'Virgin Impact-Copolymer HDPE',
    price: '₹195.00 / unit',
    moq: 'MOQ 150 pcs',
    rating: '4.8',
    badge: 'Industrial Standard',
    badgeColor: 'bg-red-700',
    image: '/hero-products/prod-24.png',
    slug: 'heavy-industrial-lubricant-grease-pail-20l-red',
    stock: 'in-stock' as const,
    discountPercent: null,
    description:
      'High-visibility 20L crimson red industrial pail with blue lock-seal cover. Designed for high-viscosity lubricating greases, bitumen emulsions, industrial coatings, and automotive fluids.',
  },
  {
    name: 'Heavy-Duty Rectangular Laundry & Wash Basin (45L Lime)',
    category: 'Household & Sanitary',
    grade: 'High-Flex Virgin Polypropylene',
    price: '₹260.00 / unit',
    moq: 'MOQ 75 pcs',
    rating: '4.8',
    badge: 'Textured Grips',
    badgeColor: 'bg-lime-600',
    image: '/hero-products/prod-25.png',
    slug: 'heavy-duty-rectangular-laundry-wash-basin-45l-lime',
    stock: 'in-stock' as const,
    discountPercent: 10,
    description:
      'Extra-wide rectangular 45L washing basin in fresh lime green with molded anti-slip finger-ribbed handles. Ideal for manual garment soaking, domestic laundry, and kitchen utensil sanitation.',
  },
  {
    name: 'Industrial Deep Rectangular Soaking Basin (45L Cyan)',
    category: 'Household & Sanitary',
    grade: 'Reinforced Virgin Polymer Blend',
    price: '₹275.00 / unit',
    moq: 'MOQ 75 pcs',
    rating: '4.9',
    badge: 'Deep Profile',
    badgeColor: 'bg-cyan-700',
    image: '/hero-products/prod-26.png',
    slug: 'industrial-deep-rectangular-soaking-basin-45l-cyan',
    stock: 'in-stock' as const,
    discountPercent: 12,
    description:
      'Deep-profile 45-litre cyan blue utility washing basin with curved splash-deflecting rim and reinforced bottom runners for heavy commercial laundry, hotel housekeeping, and industrial dishwashing.',
  },
  {
    name: 'Unbreakable Food-Grade Polymer Tea & Coffee Mug Set (Set of 5)',
    category: 'Food Grade Polymer',
    grade: '100% Virgin Food-Grade Polycarbonate / SAN',
    price: '₹195.00 / set',
    moq: 'MOQ 100 sets',
    rating: '5.0',
    badge: 'Set of 5 Pcs',
    badgeColor: 'bg-indigo-600',
    image: '/hero-products/prod-27.png',
    slug: 'unbreakable-food-grade-tea-coffee-mug-set-5pcs',
    stock: 'in-stock' as const,
    discountPercent: 25,
    description:
      'Set of 5 vibrant pastel drinking mugs (Cyan, Coral Pink, Apple Green, Sunshine Yellow, Lilac Purple) molded from shatterproof, BPA-free, microwave-safe food polymer with ergonomic heat-isolated handles.',
  },
];

const initialInquiries = [
  {
    inquiryId: 'INQ-1001',
    name: 'Rajesh Sharma',
    company: 'Apex Chemical Logistics Ltd',
    email: 'r.sharma@apexchem.in',
    phone: '+91 98201 44521',
    subject: 'Bulk Quote for 20L Industrial Packaging Pails',
    product: 'Industrial Airtight Packaging Pail (20L White)',
    quantity: '1,500 units',
    message:
      'We require 1,500 units of 20L airtight packaging pails with custom hazardous chemical label embossing and UN certification docs for Q3 dispatch.',
    status: 'new' as const,
    notes: [{ text: 'Assigned to North Zone sales desk.', author: 'Admin' }],
  },
  {
    inquiryId: 'INQ-1002',
    name: 'Elena Rostova',
    company: 'Vanguard Global Exports',
    email: 'elena.rostova@vanguard-trade.eu',
    phone: '+44 20 7946 0912',
    subject: 'FOB Pricing for Perforated Harvest Crates',
    product: 'Perforated Agricultural & Vegetable Harvest Crate',
    quantity: '5,000 units (40ft High Cube Container)',
    message:
      'Looking for factory-direct FOB Mumbai quotes for stackable harvest crates. We need Euro-pallet compatible footprints with custom green colorway.',
    status: 'in-progress' as const,
    notes: [{ text: 'Shared FOB pricing breakdown for 40ft HQ container.', author: 'Admin' }],
  },
];

const seedData = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
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
    } catch {
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
