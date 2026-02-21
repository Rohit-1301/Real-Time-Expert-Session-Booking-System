const Booking = require('../models/Booking');
const Expert  = require('../models/Expert');

/**
 * POST /bookings
 *
 * RACE CONDITION PREVENTION (3 layers):
 * ──────────────────────────────────────────────────────────────────────
 * Layer 1 — Availability check: verify slot exists in expert.availableSlots
 *           before attempting any DB write (fast fail, saves DB writes).
 * Layer 2 — Atomic slot removal: $pull the slot from the expert document
 *           first using findOneAndUpdate with an array-match condition.
 *           If the slot was already removed by a concurrent request, the
 *           update returns null → we return 409 immediately without
 *           creating a dangling Booking document.
 * Layer 3 — Unique compound index on Booking {expert, date, timeSlot}:
 *           final DB-level guard — returns error.code 11000 if somehow
 *           two writes reach the DB simultaneously.
 * ──────────────────────────────────────────────────────────────────────
 *
 * SECURITY NOTES:
 * - expertId is validated as MongoId in the route — no CastError risk here.
 * - All string fields are sanitized (HTML stripped, length-capped) in the route.
 * - notes field defaults to empty string — never unset.
 */
const createBooking = async (req, res, next) => {
  try {
    const { expertId, name, email, phone, date, timeSlot, notes } = req.body;

    // ── Layer 2: Atomic slot removal ──────────────────────────────────────
    // Atomically find the expert AND remove the specific slot in one operation.
    // If the slot is already gone (concurrent booking), updatedExpert is null.
    const updatedExpert = await Expert.findOneAndUpdate(
      {
        _id: expertId,
        'availableSlots': {
          $elemMatch: { date: date, slots: timeSlot }
        }
      },
      { $pull: { 'availableSlots.$.slots': timeSlot } },
      { new: false } // we don't need the updated doc, just need to know it matched
    );

    if (!updatedExpert) {
      // Either expert doesn't exist OR this slot was already taken
      return res.status(409).json({
        success: false,
        message: 'This time slot is no longer available. Please choose a different slot.',
      });
    }

    // ── Layer 3: Create booking — unique index is the last guard ──────────
    const booking = await Booking.create({
      expert:   expertId,
      name:     name.trim(),
      email:    email.toLowerCase().trim(),
      phone:    phone.trim(),
      date,
      timeSlot,
      notes:    (notes || '').trim(),
    });

    // ── Real-time: Notify all connected clients ───────────────────────────
    const io = req.app.get('io');
    if (io) {
      io.emit('slotBooked', { expertId, date, timeSlot });
    }

    // Respond with populated booking (never expose raw __v or internal fields)
    const populated = await booking.populate('expert', 'name category');

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      data: {
        _id:      populated._id,
        expert:   populated.expert,
        date:     populated.date,
        timeSlot: populated.timeSlot,
        status:   populated.status,
        createdAt: populated.createdAt,
      },
    });
  } catch (error) {
    // Duplicate-key — Layer 3 fired (should be extremely rare given Layer 2)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This time slot has just been booked by someone else. Please choose a different slot.',
      });
    }
    next(error);
  }
};

/**
 * GET /bookings?email=
 * Returns bookings filtered by email.
 *
 * SECURITY:
 * - email is validated + normalised in the route (isEmail + normalizeEmail)
 * - We only return non-sensitive fields via populate select
 */
const getBookingsByEmail = async (req, res, next) => {
  try {
    const email = req.query.email;

    // Belt-and-suspenders: validation middleware should catch this first,
    // but if a non-string arrives (e.g. NoSQL injection object), reject safely.
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'A valid email query parameter is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Secondary guard: reject anything that doesn't look like a plain email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const bookings = await Booking.find({ email: normalizedEmail })
      .populate('expert', 'name category')
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /bookings/:id/status
 *
 * SECURITY:
 * - :id validated as MongoId in route — no CastError
 * - status validated as one of the allowed enum values in route
 * - We only update the status field (no mass assignment possible)
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // already whitelisted by route validator

    // Fetch the booking first so we know the expertId, date, and timeSlot
    // before updating — needed for slot restoration on cancellation
    const existing = await Booking.findById(req.params.id).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Prevent re-cancelling an already cancelled booking
    if (existing.status === 'Cancelled' && status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    )
      .populate('expert', 'name category')
      .select('-__v')
      .lean();

    // ── Slot Restoration on Cancellation ──────────────────────────────────
    // When a booking is cancelled, push the time slot back into the expert's
    // availableSlots so it becomes bookable again by another user.
    if (status === 'Cancelled' && existing.status !== 'Cancelled') {
      await Expert.updateOne(
        { _id: existing.expert, 'availableSlots.date': existing.date },
        { $addToSet: { 'availableSlots.$.slots': existing.timeSlot } }
      );

      // Notify all clients so the restored slot appears in real-time
      const io = req.app.get('io');
      if (io) {
        io.emit('slotRestored', {
          expertId: String(existing.expert),
          date:     existing.date,
          timeSlot: existing.timeSlot,
        });
      }
    }

    res.json({ success: true, message: 'Status updated', data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getBookingsByEmail, updateBookingStatus };
