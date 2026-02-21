require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('mongo-sanitize');
const hpp = require('hpp');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const expertRoutes = require('./routes/expertRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

// ── Bootstrap ──────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

connectDB();

const io = initSocket(server, process.env.CLIENT_URL);
app.set('io', io);

// ── Security Headers (Helmet) ───────────────────────────────────────────────
// Sets X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, etc.
app.use(helmet());

// ── CORS — whitelist only the known frontend origin ────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser tools (Postman / curl) during dev; block unknown origins in prod
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PATCH'],   // removed PUT/DELETE — not needed
    credentials: true,
  })
);

// ── Body parsing — LIMIT payload size to prevent DoS ──────────────────────
app.use(express.json({ limit: '10kb' }));        // reject bodies > 10 KB
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── HTTP Parameter Pollution prevention ────────────────────────────────────
// E.g. ?status=Pending&status=Confirmed would break status logic
app.use(hpp());

// ── NoSQL Injection Prevention ─────────────────────────────────────────────
// Strips MongoDB operators ($, .) from request inputs before they reach controllers
app.use((req, _res, next) => {
  req.body    = mongoSanitize(req.body);
  req.params  = mongoSanitize(req.params);
  req.query   = mongoSanitize(req.query);
  next();
});

// ── Global API Rate Limiting ───────────────────────────────────────────────
// Prevents brute-force and DDoS — 100 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use(globalLimiter);

// ── Strict Booking Rate Limiter ────────────────────────────────────────────
// Separate, tighter limit on POST /bookings — 10 bookings per 15 min per IP
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many booking attempts. Please wait before trying again.' },
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/experts', expertRoutes);
app.use('/bookings', bookingRoutes);

// Apply tight limiter only on booking creation
app.use('/bookings', (req, res, next) => {
  if (req.method === 'POST') return bookingLimiter(req, res, next);
  next();
});

// Health check — no sensitive info exposed
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 404 fallback
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Centralized error middleware (must be last)
app.use(errorMiddleware);

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
