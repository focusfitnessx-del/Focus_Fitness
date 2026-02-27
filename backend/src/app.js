require('dotenv').config();
process.env.TZ = 'Asia/Colombo';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth.routes');
const memberRoutes = require('./routes/member.routes');
const paymentRoutes = require('./routes/payment.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reminderRoutes = require('./routes/reminder.routes');
const entryRoutes = require('./routes/entry.routes');
const settingRoutes = require('./routes/setting.routes');
const cronRoutes = require('./routes/cron.routes');
const planRoutes = require('./routes/plan.routes');

// Cron Jobs
require('./cron/scheduler');

const app = express();

// Trust Railway / Netlify / Heroku reverse proxy (required for rate-limit + req.ip accuracy)
app.set('trust proxy', 1);

// ── Security Middleware ────────────────────────────────────────────────────
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

const allowedOrigin = (process.env.CORS_ORIGIN ||
  (process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : null))
  ?.replace(/\/$/, ''); // strip accidental trailing slash
if (!allowedOrigin) {
  throw new Error('CORS_ORIGIN env var must be set in production');
}
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

app.use(limiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(hpp());

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/entry', entryRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/members/:id/plans', planRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global Error Handler ──────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Focus Fitness API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
