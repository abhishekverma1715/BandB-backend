import dns from 'dns';
import mongoose from 'mongoose';

// Fix Windows and cloud DNS SRV lookup issues for MongoDB Atlas clusters
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch {
  // Graceful fallback
}

export const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      if (process.env.NODE_ENV === 'test') {
         return; // tests handle their own connection
      }
      throw new Error('MONGODB_URI is not defined');
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};
