const multer = require("multer");
const path = require("path");
const { Places, GalleryImage } = require("../Models/placeModel");

// ------------------ MULTER SETUP ------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads", "places"));
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

// FIELDS (MAIN + MULTIPLE GALLERY IMAGES)
exports.uploadPlaceImages = upload.fields([
  { name: "image", maxCount: 1 }, // Main image
  { name: "galleryImage", maxCount: 10 }, // Multiple gallery images
]);

// ------------------ CREATE PLACE ------------------
exports.createPlaces = async (req, res) => {
  try {
    console.log("FILES RECEIVED:", req.files);

    // MAIN IMAGE
    const mainImage = req.files?.image?.[0]?.filename || null;

    // GALLERY IMAGES (Array)
    const galleryImages = req.files?.galleryImage
      ? req.files.galleryImage.map((img) => img.filename)
      : [];

    // -------- CREATE PLACE DOCUMENT ----------
    const place = await Places.create({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      location: {
        lat: req.body.lat,
        lng: req.body.long,
      },
      days: req.body.days,
      state: req.body.state?.trim().toLowerCase(),
      nights: req.body.nights,
      includes: req.body.includes,
      excludes: req.body.excludes,
      images: mainImage, // Store MAIN image
    });

    // -------- CREATE GALLERY DOCUMENT ----------
    const galleryDoc = await GalleryImage.create({
      placeId: place._id,
      imageUrl: galleryImages, // Array of images
    });

    // SUCCESS
    return res.status(201).redirect("http://localhost:3000/admin/");
    res.status(201).json({
      status: "success",
      message: "Place created successfully",
      place,
      gallery: galleryDoc,
    });
  } catch (err) {
    console.log("Error:", err);
    res.status(500).json({
      status: "error",
      message: "Server error occurred",
      error: err.message,
    });
  }
};
