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
const { Booking, Payment } = require("./../Models/bookingModel");
// const { json } = require("stream/consumers");

exports.displayLogin = async (req, res) => {
  res.render("user/login");
};
exports.displaySignup = async (req, res) => {
  res.render("user/signup");
};

exports.auth = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    // return res.render("user/login");
    // return res.redirect("http://localhost:3000/login");
    req.user = null;
    // console.log("Auth User:", req.user);
    return next();
  }
  // return res.status(401).json({ message: "You are not logged in!" });
  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const findedUser = await User.findById(decode.id);
    if (findedUser === null) {
      req.user = null;
      // console.log("Auth User:", req.user);
      return next();
    }
    // console.log("decoded Token:", decode);
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
    // console.log("user Token:", token);
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
        { address: { $regex: query, $options: "i" } },
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
    console.log("Hotel Details:", room);
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
  console.log(userID);
  const user = (await User.findById(userID)) || false;
  console.log("USER:" + user);
  res.render("user/account", { user });
};
exports.displayPackages = function (req, res) {
  const user = req.user;
  res.render("user/packages", { user });
};

exports.displayRoomDetails = async (req, res) => {
  // const managerId = req.manager.id;

  // const hotels = await Hotel.find({ managerId });
  // const hotelIds = hotels.map((h) => h._id);

  // const room = await Room.find({
  //   hotelID: { $in: hotelIds },
  // });
  const roomID = req.params.id;
  const room = await Room.findById(roomID);
  const user = req.user;
  const totalRooms = 100;
  const bookedRooms = 90;
  console.log("Room detrails:", room);
  res.render("user/roomDetails", { user, room, totalRooms, bookedRooms });
};
exports.displayCurrentHotelRoomDetails = async (req, res) => {
  const hotelID = req.params.id;
  const user = req.user;

  const rooms = await Room.find({ hotelID });
  // console.log("HotelID:", hotelID);
  // console.log("Rooms of this Hotel:", rooms);
  res.render("user/rooms", { user, rooms });
};

exports.createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = req.user;
    const roomID = req.body.roomID;
    const hotel = await Room.findById(roomID).populate("hotelID");

    const {
      name,
      phone,
      checkInDate,
      checkOutDate,
      adults,
      children,
      roomTypeCode,
      roomNum,
    } = req.body;
    const booking = new Booking({
      name,
      phone,
      checkInDate,
      checkOutDate,
      adults,
      children,
      roomTypeCode,
      roomNum,
      userId,
      hotelId: hotel.hotelID._id,
    });
    await booking.save();
    console.log("Booking:", roomID);
    res.status(201).render("user/booking", { roomID, user, hotel, booking });
    // res.status(201).json({ booking });
  } catch (err) {
    res.status(500).json({ message: "Booking Failed!", ERROR: err.message });
  }
};

exports.payment = async (req, res) => {
  try {
    console.log("user:", req.user.id);
    const {
      bookingId,
      roomID,
      roomType,
      price,
      guestName,
      email,
      phone,
      specialRequest,
      cardName,
      cardNumber,
      expMonth,
      expYear,
      cvc,
      amount,
    } = req.body;

    const payment = new Payment({
      bookingId,
      userId: req.user.id,
      roomId: roomID,
      guestName,
      email,
      phone,
      specialRequest,
      roomType,
      price,
      cardName,
      cardNumber,
      expMonth,
      expYear,
      cvc,
      amount,
    });

    if (await payment.save()) {
      await Room.findByIdAndUpdate(roomID, { isBooked: true }, { new: true });
      res.status(201).render("user/payment-success");
    } else {
      const err = "Server Error!Please try again later";
      res.status(501).render("user/payment-failed", { err });
    }

    // console.log("paymetn:", d);
    // res.status(201).json({ message: "success", payment });
  } catch (err) {
    res.status(501).render("user/payment-failed", { err });
  }
};
exports.aiChatBot = async (req, res) => {
  try {
    const msg = req.body.message.toLowerCase().trim();

    /* ---------- GREETING ---------- */
    if (/\b(hi|hello|hey)\b/.test(msg)) {
      return res.json({
        reply:
          "👋 Hi! You can ask like:\n• Hotels in Goa\n• Munnar\n• Kerala hotels",
      });
    }

    // Clean message
    const cleanMsg = msg.replace(/[^\w\s]/gi, "");
    const words = cleanMsg.split(" ");

    let place = null;

    /* ---------- DETECT PLACE ---------- */
    if (cleanMsg.includes("hotel")) {
      // hotels in munnar / munnar hotels
      place = words[words.length - 1];
    } else if (words.length === 1) {
      // user typed only place name: "kerala"
      place = words[0];
    }

    /* ---------- SEARCH HOTELS ---------- */
    if (place) {
      const hotels = await Hotel.find({
        place: new RegExp(`^${place}$`, "i"),
        isApproved: true,
      }).limit(3);

      if (hotels.length === 0) {
        return res.json({
          reply: `😔 No hotels found in ${place}`,
        });
      }

      let text = `🏨 Hotels in ${place.toUpperCase()}:\n\n`;

      hotels.forEach((h) => {
        text += `• ${h.name} – ₹${h.price}/night\n`;
      });

      return res.json({ reply: text });
    }
    if (msg.includes("find hotels")) {
      return res.json({
        reply: "🏨 Sure! Try typing: Hotels in Goa / Manali / Munnar",
      });
    }

    if (msg.includes("popular places")) {
      return res.json({
        reply: "📍 Popular destinations: Goa, Manali, Munnar, Ooty, Jaipur",
      });
    }

    if (msg.includes("how booking works")) {
      return res.json({
        reply:
          "📖 Booking is simple:\n1️⃣ Choose hotel\n2️⃣ Select dates\n3️⃣ Click Book\n4️⃣ Pay & confirm",
      });
    }

    if (msg.includes("contact support")) {
      return res.json({
        reply: "☎️ Contact us at support@yourtravel.com",
      });
    }
    /* ---------- DEFAULT ---------- */
    return res.json({
      reply:
        "🤔 Try something like:\n• Hotels in Goa\n• Munnar\n• Kerala hotels",
    });
  } catch (err) {
    console.error("AI Bot Error:", err);
    return res.status(500).json({
      reply: "⚠️ Something went wrong. Please try again.",
    });
  }
};

// router.post("/", async (req, res) => {});
// exports.getBooking = async (req, res) => {
//   const roomID = req.params.id;
//   const user = req.user.id;
//   const hotel = await Room.findById(roomID).populate("hotelID");
//   // console.log("Both:", hotel);
//   res.render("user/booking", { hotel, user });
// };
