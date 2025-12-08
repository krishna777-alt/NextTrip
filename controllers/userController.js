const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const multer = require("multer");

const Package = require("./../Models/packageModel");
const User = require("./../Models/userModels");

exports.displayLogin = async (req, res) => {
  res.render("user/login");
};
exports.displaySignup = async (req, res) => {
  res.render("user/signup");
};

exports.signup = async function (req, res) {
  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.confirm_password,
    });
    await user.save();
    console.log("user:" + user);
    req.flash("success", "You can now login");
    return res.render("user/login", { success: req.flash });
    res.status(201).json({ message: "success", user });
  } catch (err) {
    console.log("ERROR:" + err);
  }
};
exports.home = async function (req, res) {
  const user = false;
  const featuredPackages = await Package.find();
  res.render("user/home", { user, featuredPackages });
};

// exports.testimonials = function (req, res) {};
