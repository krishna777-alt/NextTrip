const AdminSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    select: false,
  },
  role: {
    type: String,
    default: "admin",
  },
  account: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  image: String,
});

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
      // unique: true, // A payment transaction is uniquely tied to a single booking
      index: true,
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: false, // If booking was made by a guest
      index: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
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
      default: "CAPTURED",
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

const constactSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "none",
  },
  email: {
    type: String,
  },
  subject: {
    type: String,
    default: "no subject",
  },
  message: {
    type: String,
    default: "none",
  },
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
});

const hotelManagerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    default: "hotel@gmail.com",
  },
  username: {
    type: String,
    default: "root",
  },
  role: {
    type: String,
    default: "manager",
  },
  password: {
    type: String,
    select: false,
    default: "root",
  },
});

const placeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    images: {
      type: String,
      required: true,
    },
    place: {
      type: String,
      default: function () {
        return this.title?.toLowerCase();
      },
    },
    state: {
      type: String,
    },
    status: {
      type: String,
      default: "live", // instantly live on website
    },
  },
  { timestamps: true }
);

// Gallery Images Schema
const galleryImageSchema = new mongoose.Schema({
  placeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Places",
    required: true,
  },
  imageUrl: {
    type: [String],
    default: [""],
    // required: true,
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: String,
    avatar: {
      type: String,
      default: "profile.png",
    },
    role: {
      type: String,
      default: "user",
    },
  },
  { timestamps: true }
);
