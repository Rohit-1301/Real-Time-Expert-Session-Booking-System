/**
 * Centralized error-handling middleware.
 *
 * SECURITY RULES:
 * - Never expose raw stack traces or internal error messages to clients in production.
 * - Map known error types to safe, generic messages.
 * - Log full details server-side only.
 */
const IS_PROD = process.env.NODE_ENV === 'production';

const errorMiddleware = (err, req, res, next) => {
  // Always log the full error on the server — never returned to client
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);
  if (!IS_PROD) console.error(err.stack);

  // ── Mongoose Validation Error ──────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  // ── Mongoose Bad ObjectId (CastError) ─────────────────────────────────
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  // ── MongoDB Duplicate Key ──────────────────────────────────────────────
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'This time slot has just been booked. Please choose a different slot.',
    });
  }

  // ── CORS Error ─────────────────────────────────────────────────────────
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ success: false, message: 'Cross-origin request not allowed' });
  }

  // ── Payload Too Large (body-parser) ───────────────────────────────────
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request payload too large (max 10KB)' });
  }

  // ── JSON Parse Error ───────────────────────────────────────────────────
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }

  // ── Generic fallback ──────────────────────────────────────────────────
  // In production, NEVER expose err.message — it may contain internal details
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: IS_PROD && statusCode === 500
      ? 'An internal error occurred. Please try again.'
      : err.message || 'Internal Server Error',
  });
};

module.exports = errorMiddleware;
