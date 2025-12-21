const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const Package = require("../Models/packageModel");
const HotelManager = require("../Models/hotelManagerModel");
const { Hotel, Room, HotelFacility } = require("../Models/hotelModel");
const { Payment, Booking } = require("./../Models/bookingModel");
// exports.auth = (req,res,next)=>{

// }
exports.logout = function (req, res) {
  res.clearCookie("jwt");
  return res.redirect("/hotel/login");
};

exports.isManager = async function (req, res, next) {
  if (req.manager.role !== "hotel") {
    return res.status(403).json({
      message: "Access Denied! managers only",
    });
  }
  const currentManager = await Hotel.findById(req.agent.id);
  // console.log(currentAgent);
  req.managerData = currentManager;

  next();
};
exports.getLogin = (req, res) => {
  const success = req.flash("success");
  res.render("hotel/login", { success });
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(req.body);
    if (!username || !password) {
      req.flash("err", "Please provide email and password");
      return res.redirect("/hotel/login");
    }
    const manager = await HotelManager.findOne({ username }).select(
      "+password"
    );
    console.log("managerL:" + manager);
    if (!manager) {
      req.flash("err", "Hotel not found!");
      return res.redirect("/hotel/login");
    }

    const checkPassword = await bcrypt.compare(password, manager.password);
    console.log(checkPassword);
    if (!checkPassword) {
      req.flash("err", "Invalid password or username");
      return res.redirect("/hotel/login");
    }
    const token = jwt.sign(
      {
        id: manager._id,
        role: manager.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.JWT_TOKEN_EXPRIES }
    );
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.redirect("/hotel/");
    res.status(201).json({
      manager,
      token,
    });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    return res.status(500).json({ ERROR: err });
  }
};

exports.getRegister = (req, res) => {
  res.render("hotel/register");
};

exports.register = async (req, res) => {
  try {
    if (!req.body) {
      res.send("error");
    }
    const { name, email, username, password } = req.body;
    const manager = new HotelManager({
      name,
      email,
      username,
      password,
    });

    await manager.save();

    req.flash(
      "success",
      `
            successfully account registered    
            `
    );
    return res.redirect("/hotel/login");
    // res.render('agents/login',{
    //     agent:req.body.fullName,
    //     success:req.flash('Account Successfully Registered!')
    // });
  } catch (err) {
    console.log(err);
    res.status(401).json({
      status: 401,
      message: "Failed!",
      ERROR: err,
    });
  }
};
exports.auth = function (req, res, next) {
  const token = req.cookies.jwt;
  // console.log(token);
  if (!token) {
    //    return res.status(401).json({
    //         status:401,
    //         message:'You are not logged in! Pelase loggin'
    //     });
    return res.redirect("/hotel/login");
  }
  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("Decode" + decode.id);
    req.manager = decode;
    // console.log(req.manager);
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid Token!" + err });
  }
};
// //////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.getMangerDashbord = async (req, res) => {
  console.log("m:" + req.manager.id);
  const manager = (await HotelManager.findById(req.manager.id)) || false;

  const managerId = req.manager.id;

  const hotels = await Hotel.find({ managerId });
  const hotelIds = hotels.map((h) => h._id);

  const rooms = await Room.find({
    hotelID: { $in: hotelIds },
  });
  let totalRooms = hotels.map((e) => e.totalRooms)[0];
  console.log(manager);
  res.render("hotel/home", { manager, totalRooms, rooms });
};

exports.showHotel = async (req, res) => {
  const hotel = await Hotel.findOne({ managerId: req.manager.id });
  console.log("Hotel:", hotel);
  if (hotel) {
    const roomType = await Room.findOne({ hotelID: hotel._id });
    console.log("gallery:", hotel.galleryImages);
    console.log(roomType);
    return res.render("hotel/showHotel", { hotel, roomType });
  }
};
exports.getManageHotel = async (req, res) => {
  const hotel = await Hotel.findOne({ managerId: req.manager.id });
  // console.log("manager:" + req.manager.id);
  if (hotel) {
    const roomType = await Room.findOne({ hotelID: hotel._id });
    console.log("gallery:", hotel.galleryImages);
    console.log(roomType);
    return res.render("hotel/showHotel", { hotel, roomType });
  }

  const places = await Package.find();
  res.render("hotel/manageHotel", {
    places,
  });
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads", "hotels"));
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
exports.uploadHotelImage = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "galleryImages", maxCount: 10 },
  { name: "roomPhotos", maxCount: 10 },
]);

exports.createHotel = async (req, res) => {
  try {
    const managerId = req.manager.id;

    let {
      name,
      slug,
      state,
      place,
      description,
      price,
      rating,
      amenities,
      address,
      roomTypeCode,
      totalRooms,
      maxOccupancy,
      sizeSqM,

      adults,
      children,
      ac,
      bedConfiguration,
      // roomDescription,
      facilities,
      facilityCode,
      category,
    } = req.body;
    state = state?.trim().toLowerCase();
    place = place?.trim().toLowerCase();

    const image = req.files?.image?.[0]?.filename || null;
    const galleryImages = req.files?.galleryImages
      ? req.files.galleryImages.map((file) => file.filename)
      : [];
    const roomPhotos = req.files?.roomPhotos
      ? req.files.galleryImages.map((file) => file.filename)
      : [];
    const hotel = new Hotel({
      name,
      slug,
      state,
      place,
      image,
      galleryImages,
      description,
      price,
      rating,
      amenities,
      address,
      totalRooms,
      managerId,
    });
    await hotel.save();
    const hotelRoom = new Room({
      roomTypeCode,
      maxOccupancy,
      sizeSqM,
      adults,
      children,
      ac,
      hotelID: hotel._id,
      bedConfiguration,
      roomPhotos,
    });
    await hotelRoom.save();
    const hotelFacility = new HotelFacility({
      hotelId: hotel._id,
      facilities,
      facilityCode,
      category,
    });
    await hotelFacility.save();

    req.flash("success", "Hotel Successfully Created");
    req.hotel = hotel;
    console.log(req.hotel);
    return res.redirect("/hotel/manageHotel");
  } catch (err) {
    res.status(500).json({ ErrMessage: err.message });
    req.flash("error", "Failed to Create Hotel! Please try again");
  }
};

// exports.getUpdateHotelData = (req, res) => {};
exports.updateHotelData = async (req, res) => {
  try {
    const hotelID = req.params.id;

    // Fetch existing hotel first
    const hotel = await Hotel.findById(hotelID);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    /* ---------- FILE HANDLING ---------- */

    // Main image (replace only if new uploaded)
    if (req.files?.image?.length > 0) {
      hotel.image = req.files.image[0].filename;
    }

    // Gallery images (append new ones)
    if (req.files?.galleryImages?.length > 0) {
      const newGalleryImages = req.files.galleryImages.map(
        (file) => file.filename
      );
      hotel.galleryImages.push(...newGalleryImages);
    }

    /* ---------- TEXT / FORM DATA ---------- */

    hotel.name = req.body.name;
    hotel.slug = req.body.slug;
    hotel.state = req.body.state;
    hotel.place = req.body.place;
    hotel.description = req.body.description;
    hotel.price = req.body.price;
    hotel.rating = req.body.rating;
    hotel.address = req.body.address;

    // Amenities: "wifi, pool" → ["wifi", "pool"]
    if (req.body.amenities) {
      hotel.amenities = req.body.amenities.split(",").map((a) => a.trim());
    }

    /* ---------- SAVE ---------- */
    await hotel.save();

    // Redirect back to hotel list or details page
    res.redirect("/hotel/manageHotel");
  } catch (err) {
    console.error("Update Hotel Error:", err);
    res.status(500).json({
      message: "Failed to update hotel",
      error: err.message,
    });
  }
};

exports.displayRooms = async function (req, res) {
  const managerId = req.manager.id;

  const hotels = await Hotel.find({ managerId });
  const hotelIds = hotels.map((h) => h._id);

  const rooms = await Room.find({
    hotelID: { $in: hotelIds },
  });
  let totalRooms = hotels.map((e) => e.totalRooms)[0];
  console.log("Rooms:", rooms);
  console.log("Hotels:", totalRooms);
  res.render("hotel/rooms", { rooms, totalRooms });
};

exports.displayAddRoom = (req, res) => {
  res.render("hotel/addRoom");
};

const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads", "hotels"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter2 = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new Error("Only images allowed"), false);
};

const upload2 = multer({ storage: storage2, fileFilter: fileFilter2 });
exports.uploadRoomImage = upload2.fields([
  { name: "roomMainImage", maxCount: 1 },
  { name: "roomGalleryImages", maxCount: 10 },
]);
exports.createAddRoom = async (req, res) => {
  try {
    const {
      roomTypeCode,
      maxOccupancy,
      adults,
      children,
      sizeSqM,
      roomNum,
      ac,
      bedConfiguration,
    } = req.body;

    const roomImage = req.files?.roomMainImage?.[0]?.filename;
    const galleryImages = req.files?.roomGalleryImages?.map((f) => f.filename);

    const bedConfigArray = bedConfiguration?.split(",").map((b) => b.trim());
    const managerId = req.manager.id;
    const hotel = await Hotel.findOne({ managerId });
    const hotelID = hotel._id;

    const rooms = new Room({
      roomTypeCode,
      maxOccupancy,
      sizeSqM,
      adults,
      children,
      ac,
      roomNum,
      roomPhotos: roomImage,
      galleryImages,
      hotelID,
      bedConfiguration: bedConfigArray,
    });
    await rooms.save();
    // res.status(201).render("hotel/home", { rooms });
    res.redirect("http://localhost:3000/hotel/rooms");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.displayUpdateRoom = async (req, res) => {
  try {
    // const managerId = req.manager.id;
    const roomId = req.params.id;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).send("Room not found");
    }
    // console.log("HotelRooms:", room);
    res.render("hotel/updateRoom", { room });
  } catch (err) {
    res.status(500).json({ ERR_Message: err.message });
  }
};

exports.roomUpdate = async (req, res) => {
  try {
    const roomId = req.params.id;

    const roomImage = req.files?.roomMainImage?.[0]?.filename;
    const galleryImages = req.files?.roomGalleryImages?.map((f) => f.filename);

    const updatedData = {
      roomTypeCode: req.body.roomTypeCode,
      price: req.body.price,
      maxOccupancy: req.body.maxOccupancy,
      sizeSqM: req.body.sizeSqM,
      adults: req.body.adults,
      children: req.body.children,
      ac: req.body.ac,
      roomNum: req.body.roomNum,
      mainImage: roomImage,
      roomPhotos: galleryImages,
      bedConfiguration: req.body.bedConfiguration
        ?.split(",")
        .map((b) => b.trim()),
    };

    // console.log("Files:", roomImage, galleryImages);
    // if (req.files?.galleryImages) {
    //   updatedData.roomPhotos = req.files.galleryImages.map(f => f.filename);
    // }

    await Room.findByIdAndUpdate(roomId, updatedData, { new: true });

    res.redirect("/hotel/rooms");
  } catch (err) {
    res.status(500).json({ ERR: err.message });
  }
};
exports.displayManageBooking = async (req, res) => {
  try {
    /* ------------------------------------------------
       1️⃣ Get logged-in manager
    ------------------------------------------------ */
    const managerId = req.manager.id;

    /* ------------------------------------------------
       2️⃣ Find hotel owned by manager
    ------------------------------------------------ */
    const hotel = await Hotel.findOne({ managerId });

    if (!hotel) {
      return res.render("hotel/booking", {
        bookings: [],
        message: "No hotel found for this account",
      });
    }

    const hotelId = hotel._id;

    /* ------------------------------------------------
       3️⃣ Get bookings of this hotel
    ------------------------------------------------ */
    const hotelBookings = await Booking.find({ hotelId }, "_id");

    if (hotelBookings.length === 0) {
      return res.render("hotel/booking", {
        bookings: [],
        message: "No bookings yet for your hotel",
      });
    }

    const bookingIds = hotelBookings.map((b) => b._id);

    /* ------------------------------------------------
       4️⃣ Get payments linked to those bookings
    ------------------------------------------------ */
    const payments = await Payment.find({
      bookingId: { $in: bookingIds },
    })
      .populate("userId", "name email")
      .populate("roomId")
      .populate("bookingId") // enough
      .sort({ createdAt: -1 });

    /* ------------------------------------------------
       5️⃣ Render
    ------------------------------------------------ */
    res.render("hotel/booking", {
      bookings: payments,
      hotel,
    });
  } catch (err) {
    console.error("Manage Booking Error:", err);
    res.status(500).json({
      message: "Failed to load bookings",
      error: err.message,
    });
  }
};
