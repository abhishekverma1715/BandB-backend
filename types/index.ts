import { Request } from 'express';
import { Document, Types } from 'mongoose';

export type ProductStock = 'in-stock' | 'low-stock' | 'out-of-stock';
export type InquiryStatus = 'new' | 'in-progress' | 'resolved' | 'archived';

// Product Interface
export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  category: string;
  grade: string;
  price: string;
  moq: string;
  rating: string;
  badge?: string;
  badgeColor?: string;
  image: string;
  slug: string;
  stock: ProductStock;
  discountPercent?: number | null;
  description: string;
  specifications: Map<string, string> | Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

// Inquiry Note Sub-document Interface
export interface IInquiryNote {
  _id?: Types.ObjectId;
  text: string;
  author: string;
  createdAt?: Date;
}

// Inquiry Interface
export interface IInquiry extends Document {
  _id: Types.ObjectId;
  inquiryId: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  subject: string;
  product?: string;
  quantity?: string;
  message: string;
  newsletter: boolean;
  privacy: boolean;
  status: InquiryStatus;
  notes: IInquiryNote[];
  createdAt: Date;
  updatedAt: Date;
}

// Category Interface
export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Admin Interface
export interface IAdmin extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// JWT Payload Interface
export interface IJWTPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Authenticated Express Request Interface
export interface AuthRequest extends Request {
  adminId?: string;
  adminEmail?: string;
  adminRole?: string;
  admin?: IAdmin;
}

// Universal API Response Interface
export interface IApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: unknown;
  count?: number;
}

// Dashboard KPI Interface
export interface IDashboardStats {
  totalProducts: number;
  unreadInquiries: number;
  totalInquiries: number;
  stockAlertsCount: number;
  totalCategories: number;
  recentInquiries: IInquiry[];
  lowStockProducts: IProduct[];
}
