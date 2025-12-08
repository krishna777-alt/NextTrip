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
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place", // Connect hotel to a place
      required: true,
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

    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    address: {
      type: String,
      required: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HotelManager",
      default: null,
    },
  },
  { timestamps: true }
);
const roomTypeSchema = new mongoose.Schema(
  {
    roomTypeCode: { type: String, required: true, trim: true, unique: true }, // e.g., 'KNG_DLX'
    name: { type: String, required: true, trim: true }, // e.g., 'King Deluxe City View'
    maxOccupancy: { type: Number, required: true, min: 1 },
    sizeSqM: Number,
    bedConfiguration: [String], // e.g., ['1 King Bed', '1 Sofa Bed']
    description: String, // Room-specific description
    photoUrls: [String],
  },
  { _id: false }
);

const Hotel = mongoose.model("Hotel", hotelSchema);
module.exports = Hotel;
