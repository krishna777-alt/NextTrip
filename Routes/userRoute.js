const express = require("express");
const userController = require("./../controllers/userController");

const router = express.Router();

router
  .route("/login")
  .get(userController.displayLogin)
  .post(userController.login);

router
  .route("/signup")
  .get(userController.displaySignup)
  .post(userController.signup);

router.get(
  "/",
  userController.auth,
  // userController.isUser,
  userController.home
);

router.get("/places", userController.auth, userController.displayPlaces);
router.get(
  "/placeDetails/:id",
  userController.auth,
  userController.displayPlaceDetails
);

router.get("/hotels", userController.auth, userController.diplayHotel);

router.get("/about", userController.auth, userController.displayAboutPage);

router
  .route("/contact")
  .get(userController.auth, userController.displayContactPage)
  .post(userController.auth, userController.contactData);
module.exports = router;
