const mongoose = require("mongoose");

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

const Contact = mongoose.model("Contact", constactSchema);

module.exports = Contact;
