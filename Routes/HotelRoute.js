const express = require("express");
const hotelController = require("../controllers/hotelController");

const router = express.Router();

router.get("/logout", hotelController.logout);

router
  .route("/login")
  .get(hotelController.getLogin)
  .post(hotelController.login);

router
  .route("/register")
  .get(hotelController.getRegister)
  .post(hotelController.register);
// .post(agentController.login);
/////////////////////////////////////////////////////
router.get(
  "/",
  hotelController.auth,
  hotelController.getMangerDashbord
  // hotelController.auth,
  // hotelController.getManageHotel
);

// router.get("/").get(hotelController.auth, hotelController.getManageHotel);
router
  .route("/manageHotel")
  .get(hotelController.auth, hotelController.getManageHotel)
  .post(
    hotelController.auth,
    hotelController.uploadHotelImage,
    hotelController.createHotel
  );

router.get("/rooms", hotelController.auth, hotelController.displayRooms);
router.get("/rooms/showRoom/:id",hotelController.auth,hotelController.showRoomDetails);
router
  .route("/rooms/addRoom")
  .get(hotelController.auth, hotelController.displayAddRoom)
  .post(
    hotelController.auth,
    hotelController.uploadRoomImage,
    hotelController.createAddRoom
  );
router
  .route("/rooms/updateRoom/:id")
  .get(hotelController.auth, hotelController.displayUpdateRoom)
  .patch(hotelController.uploadRoomImage, hotelController.roomUpdate);

router.get("/showHotel", hotelController.auth, hotelController.showHotel);

router.post(
  "/updateHotel/:id",
  hotelController.uploadHotelImage,
  hotelController.updateHotelData
);
router.get(
  "/manageBookings",
  hotelController.auth,
  hotelController.displayManageBooking
);
// router.get("/show", hotelController.showHotel);
// router
//   .route("/agentPackage")
//   .get(agentController.auth, agentController.displayAgentPackage);

// router.route("/profile").get(agentController.agentProfile);

// router.route("/hotels").get(hotelController.displayHotels);
module.exports = router;
