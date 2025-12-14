const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const multer = require("multer");

const Package = require("../Models/packageModel");
const User = require("./../Models/userModels");
const Contact = require("./../Models/contactModel");
const HotelReview = require("./../Models/hotelReviewModel");
const { Hotel, Room, HotelFacility } = require("../Models/hotelModel");
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
    const popularPlace = (await Places.find().limit(3)) || null;
    return res.render("user/home", { user, popularPlace });
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
  const popularPlace = await Places.find().limit(3);
  res.render("user/home", { user, popularPlace });
};

exports.search = async function async(req, res) {
  try {
    const user = req.user || false;
    const query = req.query.q?.trim().toLowerCase();
    if (!query) return res.redirect("/");

    const hotels = await Hotel.find({
      isApproved: true,
      $or: [
        { place: { $regex: query, $options: "i" } },
        { state: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    });

    const places = await Places.find({
      $or: [
        { place: { $regex: query, $options: "i" } },
        { state: { $regex: query, $options: "i" } },
        { title: { $regex: query, $options: "i" } },
      ],
    });

    console.log("q:" + query);
    res.render("user/searchResult", { hotels, places, query, user });
    // res.status(200).json({ message: "success", query, hotels, places });
  } catch (err) {
    res.status(500).json({ message: "faled!", Error: err.message });
  }
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
  const states = ["kerala", "tamilnadu", "karnadaka", "gova"];
  const place = await Places.findById(id);
  const galleryImages = await GalleryImage.findOne({ placeId: place._id });

  const gimg = galleryImages.imageUrl;
  const hotels = await Hotel.find({ isApproved: true, state: place.state });
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
  const hotels = await Hotel.find({ isApproved: true });
  const room = await Room.find();

  const acRooms = room.map((e) => e.ac);
  // console.log(acRooms);
  res.status(200).render("user/hotel", {
    hotels,
    user,
    acRooms,
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

exports.displayHotelDetails = async (req, res) => {
  try {
    const hotelID = req.params.id;
    const user = req.user;
    console.log(user);
    const hotel = await Hotel.findById(hotelID);
    const facilityDoc = await HotelFacility.findOne({ hotelId: hotelID });
    const room = await Room.find({ hotelID });
    const facilities = facilityDoc ? facilityDoc.facilities : [];

    const reviews = await HotelReview.find({ hotelID }).populate(
      "userID",
      "name avatar"
    );
    console.log("Reviews:" + reviews);
    // console.log("FACILITIES ARRAY:", facilities);

    res.render("user/hotelDetails", { hotel, facilities, room, user, reviews });
  } catch (err) {
    res.status(500).json({ "ERROR:": err });
  }
};

exports.createHotelReview = async (req, res) => {
  try {
    const hotelID = req.params.id;
    const userID = req.user.id;
    console.log("BOdy:" + userID);
    const review = new HotelReview({
      message: req.body.reviewText,
      rating: req.body.rating,
      userID,
      hotelID,
    });
    console.log("userID:" + userID);
    await review.save();
    res.status(200).json({ message: "success", review });
  } catch (err) {
    res.status(500).json({ ERROR: err.message });
  }
};

exports.displayUserAccount = async (req, res) => {
  const userID = req.user.id;
  const user = await User.findById({ _id: userID });
  // console.log("USER:" + user);
  res.render("user/account", { user });
};
