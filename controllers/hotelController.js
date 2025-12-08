const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const Package = require("../Models/packageModel");
const Hotel = require("../Models/hottleModel");
const HotelManager = require("../Models/hotelManagerModel");
// exports.auth = (req,res,next)=>{

// }
exports.logout = function (req, res) {
  res.clearCookie("jwt");
  return res.redirect("/api/hotel/login");
};
exports.auth = function (req, res, next) {
  const token = req.cookies.jwt;
  // console.log(token);
  if (!token) {
    //    return res.status(401).json({
    //         status:401,
    //         message:'You are not logged in! Pelase loggin'
    //     });
    return res.redirect("/api/hotel/login");
  }
  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log(decode);
    req.manager = decode;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid Token!" + err });
  }
};
exports.isManager = async function (req, res, next) {
  if (req.agent.role !== "hotel") {
    return res.status(403).json({
      message: "Access Denied! Agents only",
    });
  }
  const currentAgent = await Hotel.findById(req.agent.id);
  // console.log(currentAgent);
  req.agentData = currentAgent;

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
      return res.redirect("/api/hotel/login");
    }
    const manager = await HotelManager.findOne({ username }).select(
      "+password"
    );
    console.log("managerL:" + manager);
    if (!manager) {
      req.flash("err", "Hotel not found!");
      return res.redirect("/api/hotel/login");
    }

    const checkPassword = await bcrypt.compare(password, manager.password);
    console.log(checkPassword);
    if (!checkPassword) {
      req.flash("err", "Invalid password or username");
      return res.redirect("/api/hotel/login");
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

    return res.redirect("/api/hotel/");
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
    const agent = new HotelManager({
      name,
      email,
      username,
      password,
    });

    await agent.save();

    req.flash(
      "success",
      `
            successfully account registered    
            `
    );
    return res.redirect("http://localhost:3000/api/hotel/login");
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

// //////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.getMangerDashbord = (req, res) => {
  res.render("hotel/home");
};

exports.getManageHotel = async (req, res) => {
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
]);

exports.createHotel = async (req, res) => {
  try {
    const managerId = req.manager.id;

    const {
      name,
      slug,
      place,

      description,
      price,
      rating,
      amenities,

      lat,
      lng,
      address,
    } = req.body;

    const image = req.files?.image?.[0]?.filename || null;

    const galleryImages = req.files?.galleryImages
      ? req.files.galleryImages.map((file) => file.filename)
      : [];

    // console.log(imageFilename, galleryFilenames);
    // console.log(image, galleryImages);
    const hotel = await Hotel.create({
      name,
      slug,
      place,
      description,
      price,
      image,
      galleryImages,
      rating,

      amenities,
      location: {
        lat,
        lng,
      },
      address,
      managerId: managerId,
    });
    console.log("hotel:" + hotel);
    res
      .status(201)
      .json({ message: "success", data: req.body, files: req.files, hotel });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
