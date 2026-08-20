import mongoose from 'mongoose';
import dns from 'dns';

// Fix Windows DNS SRV lookup issues for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  // fallback gracefully
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};
