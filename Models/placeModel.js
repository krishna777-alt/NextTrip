const mongoose = require("mongoose");

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

    price: {
      type: Number,
      required: true,
    },

    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    days: {
      type: Number,
      default: 2,
    },
    nights: {
      type: Number,
      default: 2,
    },

    includes: [String],
    excludes: [String],

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
const GalleryImage = mongoose.model("GalleryImage", galleryImageSchema);
const Places = mongoose.model("Places", placeSchema);

module.exports = {
  Places,
  GalleryImage,
};
