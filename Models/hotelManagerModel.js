const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
  role:{
    type:String,
    default:"manager"
  },
  password: {
    type: String,
    select: false,
    default: "root",
  },
});

hotelManagerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

const HotelManager = mongoose.model("HotelManager", hotelManagerSchema);
module.exports = HotelManager;
