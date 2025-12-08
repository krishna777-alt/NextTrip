// Booking.js
const mongoose = require("mongoose");

// Embedded Guest Schema
const guestSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    // --- RELATIONSHIPS ---
    hotelId: {
      type: mongoose.Schema.ObjectId,
      ref: "Hotel",
      required: true,
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: false, // Could be a guest booking
      index: true,
    },

    // --- BOOKING DETAILS ---
    roomTypeCode: { type: String, required: true }, // The room type booked (e.g., 'KNG_DLX')
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },

    // --- GUEST & OCCUPANCY ---
    leadGuest: guestSchema,
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 },

    // --- PRICE & STATUS ---
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: [
        "CONFIRMED",
        "PENDING_PAYMENT",
        "CANCELED",
        "CHECKED_IN",
        "CHECKED_OUT",
      ],
      default: "PENDING_PAYMENT",
      required: true,
    },

    // --- AUDIT & TIMESTAMPS ---
    bookingConfirmationCode: {
      type: String,
      required: true,
      unique: true,
    },
    paymentId: {
      // Reference to a separate Payment Transaction document
      type: mongoose.Schema.ObjectId,
      ref: "Payment",
      required: false,
    },
  },
  {
    timestamps: true, // Tracks booking creation time
  }
);

// Compound Index for retrieving bookings quickly
bookingSchema.index({ hotelId: 1, checkInDate: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
