import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import inquiryRoutes from './routes/inquiries.js';
import categoryRoutes from './routes/categories.js';
import dashboardRoutes from './routes/dashboard.js';

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());

// Dynamic CORS configuration for Railway & Vercel
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check if origin is in whitelist or is any vercel.app deployment
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }

      return callback(null, true); // Permissive for production deployment
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
});
app.use('/api', limiter);

// Root & Health Check Endpoints (for Railway health check)
app.get('/', (req, res) => {
  res.json({
    name: 'B&B Plastic Backend API',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start Database & Server
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 B&B Plastic Backend running on port ${PORT}`);
  });
});
