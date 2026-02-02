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
const Admin = require("../Models/adminModel");
// const { json } = require("stream/consumers");

exports.displayLogin = async (req, res) => {
  res.render("user/login");
};
exports.displaySignup = async (req, res) => {
  res.render("user/signup");
};

exports.logout = (req, res) => {
  res.clearCookie("jwt");
  return res.redirect("/");
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
      { expiresIn: process.env.JWT_TOKEN_EXPRIES },
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
// ///////////////////////////////////////////////////////////////////////////////////////////////////

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads", "user"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new Error("Only images allowed"), false);
};

const upload = multer({ storage, fileFilter });
exports.uploadUserProfile = upload.single("avatar");

exports.updateUserAvatar = async (req, res) => {
  try {
    const id = req.user.id;
    const avatar = req.file.filename;

    const updateAvatar = await User.findByIdAndUpdate(
      id,
      { avatar },
      { new: true },
    );
    console.log("Profile:", updateAvatar);
    res.redirect("http://localhost:3000/account");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ///////////////////////////////////////////////////////////////////////////////////////////////////
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
  // const states = ["kerala", "tamilnadu", "karnadaka", "gova"];
  const places = await Places.find();
  const states = places.map((s) => s.state);
  const statePlaces = places.map((p) => p.place);
  console.log(statePlaces);
  res.status(200).render("user/places", { user, states, places, statePlaces });
};

exports.displayPlaceDetails = async (req, res) => {
  const user = req.user;
  const id = req.params.id;
  const states = ["kerala", "tamilnadu", "karnadaka", "gova"];
  const place = await Places.findById(id);
  const galleryImages = await GalleryImage.findOne({ placeId: place._id });

  const gimg = galleryImages.imageUrl;
  const hotels = await Hotel.find({ isApproved: true, place: place.place });
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
      "name avatar",
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
  try {
    const userID = req.user.id;
    const user = req.user || false;
    console.log("hel:", user);
    const booking =
      (await Booking.find({ userId: userID })
        .populate("hotelId")
        .sort({ createdAt: -1 })) || false;
    console.log("fdef:xxxxxxx:", booking);
    // if (booking.length === 0) {
    //   const userDetails = await User.findById(userID) || null;
    //   return res.render("user/account", {
    //     user,
    //     userDetails,
    //     booking: [],
    //     payments: [],
    //     facilities: [],
    //     hotel: null,
    //     reviews: [],
    //   });
    // }
    const userDetails = (await User.findById(userID)) || false;
    console.log("UserfdL:", userDetails);
    //  bookings.forEach((e)=>console.log("ferfer:",e.hotelId._id));

    const payment =
      (await Payment.find({ userId: userID }).populate({
        path: "bookingId",
        populate: { path: "hotelId" },
      })) || false;

    payment.forEach((p) => {
      console.log("ferfer:", p.bookingId);
    });
    res.render("user/account", {
      user,
      booking,
      payment,
      userDetails,
    });
  } catch (err) {
    console.error("User Account Error:", err);
    res.status(500).json({
      message: "Failed to load account",
      error: err.message,
    });
  }
};

// controllers/userController.js

exports.updateUserProfile = async (req, res) => {
  try {
    /* --------------------------------
       1️⃣ Logged-in user ID
    -------------------------------- */
    const userId = req.user.id; // from auth middleware

    /* --------------------------------
       2️⃣ Extract allowed fields only
    -------------------------------- */
    const { name, phone } = req.body;

    const updateData = {
      name: name?.trim(),
      phone: phone?.trim(),
    };

    /* --------------------------------
       3️⃣ Update user safely
       - runValidators ensures schema rules
       - new: true returns updated document
    -------------------------------- */
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    /* --------------------------------
       4️⃣ Redirect or respond
    -------------------------------- */
    return res.redirect("/settings");
    // OR: res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("Update Profile Error:", err);
    return res.status(500).json({
      message: "Failed to update profile",
      error: err.message,
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    /* --------------------------------
       1️⃣ Get logged-in user
       (password is select:false, so we must explicitly select it)
    -------------------------------- */
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    /* --------------------------------
       2️⃣ Extract form data
    -------------------------------- */
    const { currentPassword, newPassword, confirmPassword } = req.body;

    /* --------------------------------
       3️⃣ Check current password
    -------------------------------- */
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    /* --------------------------------
       4️⃣ Confirm new password
    -------------------------------- */
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match",
      });
    }

    /* --------------------------------
       5️⃣ Set new password
       (this triggers schema pre-save hooks)
    -------------------------------- */
    user.password = newPassword;
    user.passwordConfirm = confirmPassword;

    await user.save();

    /* --------------------------------
       6️⃣ Success response
    -------------------------------- */
    res.redirect("/settings");
  } catch (err) {
    console.error("Password Update Error:", err);
    res.status(500).json({
      message: "Failed to update password",
      error: err.message,
    });
  }
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

    const commission = 1000;
    const hotelAmount = price - commission;

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

    await payment.save();

    await Room.findByIdAndUpdate(roomID, { isBooked: true });

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).render("user/payment-failed", {
        err: "Booking not found",
      });
    }

    const hotelId = booking.hotelId;
    console.log("Hotel ID:", hotelId.toString());

    /* ----------------------------
       Update Admin account
    ---------------------------- */
    await Admin.findOneAndUpdate({}, { $inc: { account: commission } });

    /* ----------------------------
       Update Hotel account (FIXED)
    ---------------------------- */
    const updatedHotel = await Hotel.findByIdAndUpdate(
      hotelId,
      { $inc: { account: hotelAmount } },
      { new: true },
    );

    if (!updatedHotel) {
      console.error("Hotel update failed!");
      return res.status(500).render("user/payment-failed", {
        err: "Hotel account update failed",
      });
    }

    console.log("Updated Hotel Account:", updatedHotel.account);

    res.render("user/payment-success");
  } catch (err) {
    console.error("Payment Error:", err);
    res.status(500).render("user/payment-failed", { err: err.message });
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
