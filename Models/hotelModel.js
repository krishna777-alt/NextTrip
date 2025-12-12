const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    role: {
      type: String,
      default: "hotel",
    },
    state: {
      type: String,
      default: "kerala",
    },
    place: {
      type: String,
      default: "none",
    },

    image: {
      type: String,
      required: true,
    },

    galleryImages: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    rating: {
      type: Number,
      default: 4.0,
      min: 0,
      max: 5,
    },

    amenities: {
      type: [String],
      default: [],
    },

    address: {
      type: String,
      required: true,
    },
    totalRooms: {
      type: Number,
      default: 80,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HotelManager",
      default: null,
    },
  },
  { timestamps: true }
);
const roomTypeSchema = new mongoose.Schema({
  roomTypeCode: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  }, // e.g., 'KNG_DLX'
  // roomName: { type: String, required: true, trim: true }, // e.g., 'King Deluxe City View'
  maxOccupancy: { type: Number, required: true, min: 1 },
  sizeSqM: Number,
  adults: { type: Number, required: true, min: 1 },
  children: { type: Number, default: 0, min: 0 },
  ac: {
    type: String,
    default: "AC",
  },
  hotelID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    default: null,
  },
  bedConfiguration: [String], // e.g., ['1 King Bed', '1 Sofa Bed']
  // description: String, // Room-specific description
  roomPhotos: [String],
});

// --- 3. CORE HOTEL FACILITY SCHEMA ---
const hotelFacilitySchema = new mongoose.Schema(
  {
    // --- RELATIONSHIP ---
    hotelId: {
      type: mongoose.Schema.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },

    // --- IDENTITY AND CATEGORY ---
    facilities: {
      type: [String],
      default: [],
      trim: true,
    },
    facilityCode: {
      type: String, // A standardized code for searching/filtering (e.g., 'ONSITE_PARK', 'INDOOR_POOL')
      required: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      enum: [
        "Dining",
        "Wellness",
        "Recreation",
        "Business",
        "Service",
        "General",
      ],
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    // Typically, a hotel would have multiple facility documents (one for each restaurant, one for the spa, etc.)
  }
);

// --- INDEXES ---

// Index for quickly finding all facilities for a given hotel
hotelFacilitySchema.index({ hotelId: 1, facilityCode: 1 }, { unique: true });

const HotelFacility = mongoose.model("HotelFacility", hotelFacilitySchema);

const Hotel = mongoose.model("Hotel", hotelSchema);
const Room = mongoose.model("Room", roomTypeSchema);

module.exports = {
  Hotel,
  Room,
  HotelFacility,
};
