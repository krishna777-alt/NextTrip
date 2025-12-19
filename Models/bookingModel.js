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
    name: {
      type: String,
      default: "",
    },
    phone: Number,

    roomTypeCode: { type: String, required: true }, // The room type booked (e.g., 'KNG_DLX')
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },

    // --- GUEST & OCCUPANCY ---
    // leadGuest: guestSchema,
    adults: { type: Number, required: true, min: 1 },
    children: { type: Number, default: 0, min: 0 },

    // --- PRICE & STATUS ---
    totalAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR" },
    roomNum: {
      type: Number,
      default: 0,
    },
    // status: {
    //   type: String,
    //   enum: [
    //     "CONFIRMED",
    //     "PENDING_PAYMENT",
    //     "CANCELED",
    //     "CHECKED_IN",
    //     "CHECKED_OUT",
    //   ],
    //   default: "PENDING_PAYMENT",
    //   required: true,
    // },

    // --- AUDIT & TIMESTAMPS ---
    // bookingConfirmationCode: {
    //   type: String,
    //   required: true,
    //   unique: true,
    // },
    // paymentId: {
    //   // Reference to a separate Payment Transaction document
    //   type: mongoose.Schema.ObjectId,
    //   ref: "Payment",
    //   required: false,
    // },
  },
  {
    timestamps: true, // Tracks booking creation time
  }
);

// Payment.js

const paymentSchema = new mongoose.Schema(
  {
    // --- RELATIONSHIPS & IDENTIFIERS ---
    bookingId: {
      type: mongoose.Schema.ObjectId,
      ref: "Booking",
      required: true,
      unique: true, // A payment transaction is uniquely tied to a single booking
      index: true,
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: false, // If booking was made by a guest
      index: true,
    },
    // ID from the external payment gateway (e.g., Stripe, PayPal, Adyen)
    guestName: String,
    email: String,
    phone: Number,
    specialRequest: {
      type: String,
      default: "No specialRequest",
    },
    roomType: String,
    price: Number,
    cardName: String,
    cardNumber: Number,
    expMonth: Number,
    expYear: Number,
    cvc: Number,
    // --- FINANCIAL DETAILS ---
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      required: true,
      default: "INR",
      enum: ["USD", "EUR", "INR", "GBP", "AUD"],
    },
    paymentMethod: {
      type: String,
      enum: [
        "CreditCard",
        "DebitCard",
        "PayPal",
        "BankTransfer",
        "Wallet",
        "Other",
      ],
      default: "CreditCard",
    },

    // --- CARD DATA (Non-PCI Sensitive) ---
    // Tokenized data is stored in the gateway's secure vault, we only store references.
    cardBrand: String, // e.g., 'Visa', 'MasterCard'
    cardLast4: String, // Last four digits for display purposes (e.g., '4242')
    cardTokenReference: String, // The token received from the gateway to process refunds/future charges

    // --- STATUS AND HISTORY ---
    status: {
      type: String,
      enum: [
        "CAPTURED",
        "AUTHORIZED",
        "PENDING",
        "FAILED",
        "REFUNDED",
        "VOIDED",
      ],
      default: "PENDING",
    },
    gatewayResponseCode: String, // The specific code returned by the payment processor (e.g., 20000)
    gatewayResponseMessage: String, // The message accompanying the response code

    // --- REFUND TRACKING ---
    isRefunded: {
      type: Boolean,
      default: false,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },

    // --- AUDIT ---
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for quick lookups by status or gateway ID
paymentSchema.index({ status: 1, processedAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);
// Compound Index for retrieving bookings quickly
bookingSchema.index({ hotelId: 1, checkInDate: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = { Booking, Payment };
