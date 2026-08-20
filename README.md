# B&B Plastic — Express + MongoDB Backend API

Production-ready backend API service with MongoDB Atlas integration, JWT security, Mongoose data models, rate limiting, and CORS configuration.

---

## 🚀 Quick Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` or set your MongoDB Atlas connection string:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/bandb_plastic?retryWrites=true&w=majority
JWT_SECRET=your_secure_jwt_secret_key
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Seed Default Database (Admin, Products, Categories, Inquiries)
```bash
npm run seed
```
> **Default Admin Account:**
> - **Email:** `admin@bbplastics.com`
> - **Password:** `admin123`

### 4. Start the Server
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```
Server will be available at: `http://localhost:5000`

---

## 📡 API Endpoints Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Public | Admin login & JWT token dispatch |
| **GET** | `/api/auth/me` | Private | Current admin profile |
| **POST** | `/api/auth/logout` | Public | Clear auth cookie |
| **GET** | `/api/products` | Public | List products (search & category filters) |
| **POST** | `/api/products` | Private | Create new product |
| **PUT** | `/api/products/:id` | Private | Update product details |
| **PATCH**| `/api/products/:id/stock` | Private | Instant stock level toggle |
| **DELETE**| `/api/products/:id` | Private | Remove product from catalog |
| **GET** | `/api/inquiries` | Private | List inquiries (status & text search) |
| **POST** | `/api/inquiries` | Public | Submit quotation inquiry from website |
| **PATCH**| `/api/inquiries/:id/status` | Private | Update inquiry workflow status |
| **POST** | `/api/inquiries/:id/notes` | Private | Append internal team note |
| **DELETE**| `/api/inquiries/:id` | Private | Delete inquiry record |
| **GET** | `/api/categories` | Public | List categories with live product count |
| **POST** | `/api/categories` | Private | Create category |
| **PUT** | `/api/categories/:id` | Private | Update category |
| **DELETE**| `/api/categories/:id` | Private | Delete category |
| **GET** | `/api/dashboard/stats` | Private | Live KPI counters & recent inquiries |
