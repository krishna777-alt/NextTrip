const path = require("path");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const flash = require("connect-flash");
const Admin = require("./../Models/adminModel");
const { Hotel, Room, HotelFacility } = require("../Models/hotelModel");
const { Places, GalleryImage } = require("../Models/placeModel");
const User = require("../Models/userModels");
const HotelReview = require("../Models/hotelReviewModel");
const { Payment, Booking } = require("../Models/bookingModel");
const HotelManager = require("../Models/hotelManagerModel");

//////////////////////////////////////////////////////////////ADMIN AUTH///////////////////////////////

exports.auth = (req, res, next) => {
  const token = req.cookies.jwt;
  console.log("token:", token);
  if (!token) {
    return res.render("admin/login");
  }
  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("decode: ", decode);
    req.admin = decode;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid Token!" + err });
  }
};
exports.isAdmin = async (req, res, next) => {
  const adminID = await Admin.findById(req.admin.id);
  console.log("admin:" + req.admin.role);
  if (req.admin.role !== "admin") {
    return res.render("admin/login");
    // return res.status(403).send("Access Denied. Admins only");
  }
  // console.log('admin ID:'+req.admin.id,'admin role:'+req.admin.role);
  const currentAdmin = await Admin.findById(req.admin.id);
  console.log(currentAdmin);
  req.adminData = currentAdmin;
  next();
};

exports.getLogin = (req, res) => {
  try {
    // res.sendFile(path.join(__dirname,'../templets','admin','login.ejs'));
    // res.redirect("/api/v1/admin/login");
    res.render("admin/login", {
      successMsg: req.flash("success"),
      errorMsg: req.flash("error"),
    });
  } catch (err) {
    res.sendFile(path.join(__dirname, "../templets", "status", "404.html"));
  }
};

exports.logout = (req, res) => {
  res.clearCookie("jwt");
  return res.redirect("/admin/login");
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find admin by email
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      req.flash("error", "Admin not found");
      return res.redirect("/admin/login");
    }

    // 2. Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, admin.password);

    if (!isPasswordMatch) {
      return res.status(401).send("Invalid credentials");
    }
    //3. creating jwt token
    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
      },
      process.env.JWT_SECRET_KEY,
      // {expresIn:process.env.JWT_TOKEN_EXPRIES}
      { expiresIn: process.env.JWT_TOKEN_EXPRIES }
    );

    //4.Stores token in cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });
    //5. Success -> Redirect to admin dashboard
    return res.redirect("/admin/");
    //   return res.render("admin/home", {
    //   successMsg: req.flash("success")
    // });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    return res.status(500).json({ ERROR: err });
    // .sendFile(path.join(__dirname, "../templets/status/404.html"));
  }
};
////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

exports.adminHome = async (req, res) => {
  try {
    // res.status(200).sendFile(path.join(__dirname,'../templets','admin','home.ejs'));
    const hotels = await Hotel.find({ isApproved: false });
    console.log("hotels:" + hotels);

    const places = await Places.find();
    // res.status(200).render({ places });
    // console.log("from admin:", places);

    const viewAllHotels = await Hotel.find();
    const users = await User.find();
    const reviews = await HotelReview.find()
      .populate("userID")
      .populate("hotelID");
    const payments = await Payment.find();
    reviews.forEach((r) => {
      // console.log("HotelReviewsds:", r.userID.name);
    });
    return res.render("admin/home", {
      admin: req.adminData,
      successMsg: req.flash("success"),
      hotels,
      viewAllHotels,
      places,
      users,
      reviews,
      payments,
    });
  } catch (err) {
    res.status(404).json({
      message: "Failed " + err,
    });
  }
};

exports.viewPlaceDetails = async (req, res) => {
  try {
    const placeId = req.params.id;

    const place = await Places.findById(placeId);
    const galleryImages = await GalleryImage.find({ placeId });
    console.log("PlaceID:", placeId, " ", "places:", galleryImages.length);
    galleryImages.forEach((e) => {
      e.imageUrl.forEach((i) => {
        console.log(i);
      });
    });
    console.log("Places:", place);
    res.status(200).render("admin/viewPlaceDetails", { place, galleryImages });
  } catch (err) {
    res.status(501).json({ message: err.message });
  }
};

exports.diaplayUpdateCurentPlace = async (req, res) => {
  const placeId = req.params.id;
  const place = await Places.findById(placeId);
  const galleryImages = await GalleryImage.find({ placeId });

  res.render("admin/updateCurentPlace", { place, galleryImages });
};

const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads", "places"));
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
exports.uploadHotelImage = upload2.fields([
  { name: "image", maxCount: 1 },
  { name: "galleryImages", maxCount: 10 },
]);

exports.updateCurrentPlace = async (req, res) => {
  try {
    const placeId = req.params.id;
    console.log("Files", req.files);
    const {
      title,
      description,
      lat,
      lng,
      days,
      nights,
      includes,
      excludes,
      state,
      status,
    } = req.body;

    // Prepare update data
    const updateData = {
      title,
      description,
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      },
      days: parseInt(days),
      nights: parseInt(nights),
      includes: includes ? includes.split(",").map((item) => item.trim()) : [],
      excludes: excludes ? excludes.split(",").map((item) => item.trim()) : [],
      state,
      status,
      place: title.toLowerCase(),
    };

    // Handle main image upload
    if (req.files && req.files.image && req.files.image[0]) {
      updateData.images = req.files.image[0].filename;
    }

    const updatedPlace = await Places.findByIdAndUpdate(placeId, updateData, {
      new: true,
    });

    if (!updatedPlace) {
      return res.status(404).json({ message: "Place not found" });
    }

    // Handle gallery images upload
    if (
      req.files &&
      req.files.galleryImages &&
      req.files.galleryImages.length > 0
    ) {
      for (const file of req.files.galleryImages) {
        await GalleryImage.create({
          placeId: placeId,
          imageUrl: [file.filename],
        });
      }
    }

    req.flash("success", "Place updated successfully!");
    res.redirect("/admin/currentPlace/" + placeId);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error updating place: " + err.message });
  }
};

exports.removeGalleryImage = async (req, res) => {
  try {
    const galleryId = req.params.id;
    const img = req.query.img;
    const gallery = await GalleryImage.findById(galleryId);
    // const galleryImages = gallery;
    console.log("ef:", gallery);
    const place = await Places.findById(gallery.placeId);

    if (gallery) {
      gallery.imageUrl = gallery.imageUrl.filter((url) => url !== img);
      if (gallery.imageUrl.length === 0) {
        await GalleryImage.findByIdAndDelete(galleryId);
      } else {
        await gallery.save();
      }
      req.flash("success", "Gallery image removed successfully!");
    }
    // return res.render("admin/updateCurentPlace", { place, galleryImages });
    return res.redirect(`http://localhost:3000/admin/`);
  } catch (err) {
    console.log(err);
    req.flash("error", "Error removing gallery image");
    res.redirect("back");
  }
};
exports.viewHotelDetails = async (req, res) => {
  try {
    const hotelId = req.params.id;

    const hotel = await Hotel.findById(hotelId);
    const manager = await HotelManager.findById(hotel.managerId);
    const facilities = await HotelFacility.find({ hotelId: hotel._id });
    const roomTypes = await Room.find({ hotelID: hotel._id });

    res.render("admin/viewHotelDetails", {
      hotel,
      manager,
      facilities,
      roomTypes,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.log(err);
  }
};

exports.viewUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    res.render("admin/viewUserDetails", { user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.deleteUserDetails = async (req, res) => {
  try {
    const reviewID = req.params.id;
    await HotelReview.findByIdAndDelete(reviewID);

    return res.redirect("http://localhost:3000/admin/");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.deletePaymnetDetails = async (req, res) => {
  try {
    const { id } = req.params;
    await Payment.findByIdAndDelete(id);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.hotelAcceptedByAdmin = async (req, res) => {
  const acceptedHotelID = req.params.id;
  const hotel = await Hotel.findByIdAndUpdate(acceptedHotelID, {
    isApproved: true,
  });
  console.log("Accepted:id" + hotel);
  res.redirect("/admin");
};

exports.getManageAdmin2 = (req, res) => {
  try {
    res
      .status(200)
      .sendFile(
        path.join(__dirname, "../templets", "admin", "manage-admin.ejs")
      );
  } catch (err) {
    res.status(404).json({
      message: "Failed" + err,
    });
  }
};
exports.getManageAdmin = (req, res) => {
  res.render("admin/manage-admin", {
    successMsg: req.flash("success"),
  });
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads", "adminProfiles"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// FILE FILTER (optional)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new Error("Only images allowed"), false);
};

const upload = multer({ storage, fileFilter });

// MATCHES THE HTML FIELD NAME ↓↓↓
exports.uploadAdminImage = upload.single("image");

exports.createAdmin = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "No profile image uploaded!",
      });
    }

    const admin = await Admin.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      image: req.file.filename, // << Correct
    });
    await admin.save();

    req.flash("success", "Admin created successfully!");
    res.redirect("http://localhost:3000/admin/manage-admin");
    //   res.render('admin/manage-admin"', {
    //   // admin,
    //   successMsg: req.flash('success'),
    //   errorMsg: req.flash('error')
    // });

    // res.status(201).json({
    //   status: "success",
    //   message: "Admin created successfully!",
    //   admin
    // });
  } catch (err) {
    console.log(`ERR: ${err}`);

    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.hotelViewSection = async (req, res) => {
  const hotelID = req.params.id;
  console.log(hotelID);
  const hotel = (await Hotel.findById(hotelID)) || false;
  const room = await Room.findOne({ hotelID });
  const facilities = await HotelFacility.findOne({ hotelId: hotelID });
  // console.log(roomType);
  res.render("admin/hotelView", { hotel, room, facilities });
};

exports.updateAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;

    // Fetch the admin from DB
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).send("Admin not found");

    // Update fields
    admin.name = req.body.name || admin.name;
    admin.email = req.body.email || admin.email;
    admin.role = req.body.role || admin.role;

    // Update password only if given
    if (req.body.password && req.body.password.trim() !== "") {
      admin.password = req.body.password; // (Hash this in real projects)
    }

    // Update profile image (if new file uploaded)
    if (req.file) {
      admin.image = req.file.filename;
    }

    await admin.save();

    res.redirect("/manage-admin"); // redirect after update
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error" + err);
  }
};

// GET Update Admin Page
exports.updateAdminPage = async (req, res) => {
  try {
    const adminId = req.params.id;
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).send("Admin not found");
    }

    res.render("updateAdmin", { admin }); // render your EJS/HTML page
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

exports.getAllAdmin = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.status(200).json(admins);
  } catch (err) {
    console.log(err);
  }
};
