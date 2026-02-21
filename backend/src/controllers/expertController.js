const Expert = require('../models/Expert');

// Allowed category values — used as a whitelist to prevent regex DoS via category param
const ALLOWED_CATEGORIES = ['Technology', 'Finance', 'Healthcare', 'Marketing', 'Legal', 'Design'];

/**
 * GET /experts
 * Supports: pagination (page, limit), category filter, case-insensitive name search
 *
 * SECURITY:
 * - search param is length-capped (100 chars) to prevent ReDoS on massive regex strings
 * - category is whitelist-checked — prevents arbitrary DB queries
 * - page/limit are clamped to safe integer ranges
 */
const getExperts = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 9));
    const skip  = (page - 1) * limit;

    const filter = {};

    // ── Category whitelist ─────────────────────────────────────────────────
    if (req.query.category && req.query.category !== 'All') {
      if (!ALLOWED_CATEGORIES.includes(req.query.category)) {
        return res.status(400).json({ success: false, message: 'Invalid category value' });
      }
      filter.category = req.query.category;
    }

    // ── Search: cap at 100 chars to prevent ReDoS attacks ─────────────────
    if (req.query.search) {
      const raw = String(req.query.search).slice(0, 100);
      // Escape special regex characters in user input before using in $regex
      const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escaped, $options: 'i' };
    }

    const [experts, total] = await Promise.all([
      Expert.find(filter).skip(skip).limit(limit).select('-availableSlots'),
      Expert.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: experts,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /experts/:id
 * Returns full expert details including availableSlots.
 * ObjectId is pre-validated by the route middleware.
 */
const getExpertById = async (req, res, next) => {
  try {
    const expert = await Expert.findById(req.params.id);
    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert not found' });
    }
    res.json({ success: true, data: expert });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExperts, getExpertById };
