const express = require("express");
const adminController = require("./../controllers/adminController");
const placeController = require("./../controllers/PlaceController");
const router = express.Router();

router
  .route("/login")
  .get(adminController.getLogin)
  .post(adminController.login);

router.get("/logout", adminController.logout);
///////////////////////////////////////////////////////////////////////////////////////
router
  .route("/manage-admin")
  .get(
    adminController.auth,
    adminController.isAdmin,
    adminController.getManageAdmin
  )
  .post(adminController.uploadAdminImage, adminController.createAdmin);

router.get("/get", adminController.getAllAdmin);

router.get(
  "/",
  adminController.auth,
  adminController.isAdmin,
  adminController.adminHome
);

router.get("/update/:id", adminController.updateAdmin);

router.post(
  "/createPlaces",
  placeController.uploadPlaceImages,
  placeController.createPlaces
);

router.get("/accepted/:id", adminController.hotelAcceptedByAdmin);

router.get("/hotelView/:id", adminController.hotelViewSection);

router.get("/currentPlace/:id", adminController.viewPlaceDetails);

router.get("/currentHotel/:id", adminController.viewHotelDetails);

router.get("/currentUser/:id", adminController.viewUserDetails);

router.post("/reviews/delete/:id", adminController.deleteUserDetails);

router.post("/payments/delete/:id", adminController.deletePaymnetDetails);

router
  .route("/updateCurentPlace/:id")
  .get(adminController.diaplayUpdateCurentPlace)
  .post(adminController.uploadHotelImage, adminController.updateCurrentPlace);

router.get("/places/remove-gallery/:id", adminController.removeGalleryImage);

module.exports = router;
