const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { createBooking, getBookingsByEmail, updateBookingStatus } = require('../controllers/bookingController');
const validate = require('../middleware/validateMiddleware');

// Strip HTML tags + trim — prevents stored XSS in text fields
const stripHTML = (v) => String(v).replace(/<[^>]*>/g, '').replace(/&/g,'&amp;').trim();

// ── POST /bookings — booking creation rules ────────────────────────────────
const bookingRules = [
  body('expertId')
    .trim()
    .notEmpty().withMessage('Expert ID is required')
    // Must be a valid MongoDB ObjectId — prevents CastError crashes and injection
    .isMongoId().withMessage('Invalid expert ID format'),

  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters')
    // Escape HTML entities to prevent stored XSS
    .customSanitizer(stripHTML),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required')
    .isLength({ max: 254 }).withMessage('Email too long')  // RFC 5321 max
    .normalizeEmail(),

  body('expertId')
    .trim()
    .notEmpty().withMessage('Expert ID is required')
    .isMongoId().withMessage('Invalid expert ID format'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    // Supports international formats: +91 98765 43210, +1 (800) 123-4567, etc.
    .matches(/^[+\d\s\-().]{7,20}$/).withMessage('Invalid phone number (e.g. +91 98765 43210)'),

  body('date')
    .trim()
    .notEmpty().withMessage('Date is required')
    // Strict YYYY-MM-DD format — prevents arbitrary string injection into DB queries
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format')
    .custom((value) => {
      // Reject past dates — no point booking a slot in the past
      const today = new Date().toISOString().split('T')[0];
      if (value < today) throw new Error('Booking date cannot be in the past');
      return true;
    }),

  body('timeSlot')
    .trim()
    .notEmpty().withMessage('Time slot is required')
    // Enforce HH:MM format — prevents arbitrary string stored as timeSlot
    .matches(/^\d{2}:\d{2}$/).withMessage('Time slot must be in HH:MM format (e.g. 09:00)'),

  body('notes')
    .optional({ checkFalsy: true })
    .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters')
    // Strip HTML entities to prevent stored XSS
    .customSanitizer(stripHTML),
];

// ── GET /bookings?email= — query param validation ──────────────────────────
const emailQueryRules = [
  query('email')
    .exists({ checkFalsy: true }).withMessage('Email query parameter is required')
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .isLength({ max: 254 }).withMessage('Email too long')
    .normalizeEmail()
    // Final guard: only letters, digits, @, ., +, -  — blocks mongo operators
    .matches(/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/).withMessage('Invalid email format'),
];

// ── PATCH /bookings/:id/status — param + body validation ──────────────────
const statusRules = [
  param('id')
    .isMongoId().withMessage('Invalid booking ID format'),
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    // Whitelist-only — prevents arbitrary status values being written to DB
    .isIn(['Pending', 'Confirmed', 'Completed', 'Cancelled']).withMessage('Status must be: Pending, Confirmed, Completed, or Cancelled'),
];

// ── Route definitions ──────────────────────────────────────────────────────
router.post('/',              bookingRules,   validate, createBooking);
router.get('/',               emailQueryRules, validate, getBookingsByEmail);
router.patch('/:id/status',   statusRules,     validate, updateBookingStatus);

module.exports = router;
