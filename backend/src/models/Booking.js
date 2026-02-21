const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expert',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    date: { type: String, required: true },        // YYYY-MM-DD
    timeSlot: { type: String, required: true },    // e.g. "10:00"
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

/**
 * RACE-CONDITION GUARD:
 * Unique compound index on (expert, date, timeSlot) guarantees
 * that even under concurrent requests only ONE booking can succeed
 * for a given slot. MongoDB's write concern ensures atomicity at
 * the document level; the duplicate-key error (code 11000) is then
 * caught and returned as HTTP 409 Conflict.
 */
bookingSchema.index({ expert: 1, date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
