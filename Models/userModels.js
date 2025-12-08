const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
    booking: [
      {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        ref: "Package",
      },
    ],
  },
  { timestamps: true }
);
userSchema
  .virtual("passwordConfirm")
  .get(function () {
    return this._passwordConfirm;
  })
  .set(function (value) {
    this._passwordConfirm = value;
  });

userSchema.pre("save", function (next) {
  if (this.isModified("password")) {
    if (this.password !== this._passwordConfirm) {
      return next(new Error("Password and Confirm Password do not match"));
    }
  }
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
