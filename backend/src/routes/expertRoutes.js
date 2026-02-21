const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const { getExperts, getExpertById } = require('../controllers/expertController');
const validate = require('../middleware/validateMiddleware');

// ── GET /experts — list with pagination, filtering, search ─────────────────
// No extra param validation needed — sanitization is handled in the controller
router.get('/', getExperts);

// ── GET /experts/:id — validate ObjectId before hitting the DB ────────────
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid expert ID format')],
  validate,
  getExpertById
);

module.exports = router;
