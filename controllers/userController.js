const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const multer = require("multer");

const Package = require("../Models/packageModel");
const User = require("./../Models/userModels");
const { Hotel, Room } = require("../Models/hotelModel");
const Contact = require("./../Models/contactModel");
const { Places, GalleryImage } = require("../Models/placeModel");

exports.displayLogin = async (req, res) => {
  res.render("user/login");
};
exports.displaySignup = async (req, res) => {
  res.render("user/signup");
};

exports.auth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    // return res.render("user/login");
    // return res.redirect("http://localhost:3000/login");
    req.user = null;
    return next();
  }
  // return res.status(401).json({ message: "You are not logged in!" });
  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decode;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid Token!" + err });
  }
};
exports.notLogged = async (req, res, next) => {
  const currentUser = await User.findById(req.user.id);
  req.user = currentUser;
  next();
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Failed,user doesnt exist!" });
    }
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.status(400).json({ message: "Invalid email or password!" });
    }
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.JWT_TOKEN_EXPRIES }
    );
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.render("user/home", { user });
    // res.status(201).json({ message: "success", user, token });
  } catch (err) {
    console.log(err);
  }
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
  const user = req.user || false;
  const featuredPackages = await Package.find().limit(2);
  res.render("user/home", { user, featuredPackages });
};

// exports.testimonials = function (req, res) {};

exports.displayPlaces = async (req, res) => {
  const user = req.user;
  const states = ["kerala", "tamilnadu", "karnadaka", "gova"];
  const places = await Places.find();
  res.status(200).render("user/places", { user, states, places });
};

exports.displayPlaceDetails = async (req, res) => {
  const user = req.user;
  const id = req.params.id;
  console.log(id);
  const states = ["kerala", "tamilnadu", "karnadaka", "gova"];
  const place = await Places.findById(id);
  const galleryImages = await GalleryImage.findOne({ placeId: place._id });

  const gimg = galleryImages.imageUrl;
  const hotels = await Hotel.find();
  res.status(200).render("user/place-details", {
    user,
    states,
    place,
    gimg,
    hotels,
  });
};

exports.diplayHotel = async (req, res) => {
  const user = req.user;
  const hotels = await Hotel.find();
  console.log(hotels);
  res.status(200).render("user/hotel", {
    hotels,
    user,
  });
};

exports.displayAboutPage = (req, res) => {
  const user = req.user;
  res.status(200).render("user/about", {
    user,
  });
};

exports.displayContactPage = (req, res) => {
  const user = req.user;
  // console.log(user);
  res.status(200).render("user/contact", {
    user,
  });
};

exports.contactData = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const userID = req.user ? req.user.id : null;
    await Contact.create({
      name,
      email,
      subject,
      message,
      userID,
    });
    req.flash("success", "Your message was successfully sent");
    return res.redirect("/contact");
  } catch (err) {
    console.log("ERR:" + err);
    req.flash("error", "Something went wrong!");
    return res.redirect("/contact");
  }
};
