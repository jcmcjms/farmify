import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';

// ── Route Imports ──────────────────────────────────────────────────────
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import jobRoutes from './routes/jobs.js';
import inventoryRoutes from './routes/inventory.js';
import cartRoutes from './routes/cart.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import verificationRoutes from './routes/verification.js';
import adminVerificationRoutes from './routes/adminVerifications.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ── Middleware ─────────────────────────────────────────────────────────

// CORS — allow frontend dev server
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// JSON body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads (verification documents, etc.)
app.use('/uploads', express.static('uploads'));

// ── Health Check ───────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ── API Routes ─────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/auth', verificationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminVerificationRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found.',
  });
});

// ── Global Error Handler ───────────────────────────────────────────────

app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║            🌾 Farmify Backend                ║
║──────────────────────────────────────────────║
║  Status:    🟢 Running                       ║
║  Port:      ${String(PORT).padEnd(36)}║
║  API URL:   http://localhost:${String(PORT).padEnd(21)}║
║  Env:       ${(process.env.NODE_ENV || 'development').padEnd(28)}║
╚══════════════════════════════════════════════╝
  `);
});

export default app;
