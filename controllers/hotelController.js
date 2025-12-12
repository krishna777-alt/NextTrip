const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const Package = require("../Models/packageModel");
const { Hotel, Room, HotelFacility } = require("../Models/hotelModel");
const HotelManager = require("../Models/hotelManagerModel");

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
  console.log(manager);
  res.render("hotel/home", { manager });
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
