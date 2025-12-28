const express = require("express");
const userController = require("./../controllers/userController");

const router = express.Router();

router.get("/logout",userController.logout);

router
  .route("/login")
  .get(userController.displayLogin)
  .post(userController.login);

router
  .route("/signup")
  .get(userController.displaySignup)
  .post(userController.signup);


router.post("/account/updateAvatar",
  userController.auth,
  userController.uploadUserProfile,
  userController.updateUserAvatar);  

router.post("/account/updateUserData",
  userController.auth,
  userController.updateUserProfile);

router.post("/account/updateUserPassword",
  userController.auth,
  userController.updatePassword);  
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

router.get(
  "/displayHotelDetails/:id",
  userController.auth,
  userController.displayHotelDetails
);

router
  .route("/hotelReview/:id")
  // .get(userController.displayHotelReview)
  .post(userController.auth, userController.createHotelReview);

router.get("/account", userController.auth, userController.displayUserAccount);

router.get("/search", userController.auth, userController.search);

router.get("/package", userController.auth, userController.displayPackages);

router.get(
  "/hotelRooms/displayRooms/:id",
  userController.auth,
  userController.displayRoomDetails
);

router.get(
  "/hotelRooms/:id",
  userController.auth,
  userController.displayCurrentHotelRoomDetails
);
// router.get("/booking/:id", userController.auth, userController.getBooking);

router.post("/bookingRoom", userController.auth, userController.createBooking);

router.post("/payment", userController.auth, userController.payment);

router.post("/chat", userController.auth, userController.aiChatBot);
module.exports = router;
