const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      default: "agent",
    },
    phone: Number,
    verified: {
      type: Boolean,
      default: true,
    },
    companyName: {
      type: String,
    },
    avatar: {
      type: String,
    },
    commissionRate: {
      type: Number,
      default: 20,
    },
  },
  {
    timestamps: true,
  }
);

agentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

const Agent = mongoose.model("Agent", agentSchema);

module.exports = Agent;
