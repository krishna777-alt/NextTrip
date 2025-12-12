const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 4.3,
    },
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    hotelID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const HotelReview = mongoose.model("HotelReview", reviewSchema);
module.exports = HotelReview;
