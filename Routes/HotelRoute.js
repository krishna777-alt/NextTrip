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
  //   agentController.isAgent,
  hotelController.getMangerDashbord
);

router
  .route("/manageHotel")
  .get(hotelController.auth, hotelController.getManageHotel)
  .post(
    hotelController.auth,
    hotelController.uploadHotelImage,
    hotelController.createHotel
  );

// router.get("/show", hotelController.showHotel);
// router
//   .route("/agentPackage")
//   .get(agentController.auth, agentController.displayAgentPackage);

// router.route("/profile").get(agentController.agentProfile);

// router.route("/hotels").get(hotelController.displayHotels);
module.exports = router;
