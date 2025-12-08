const express = require("express");
const userController = require("./../controllers/userController");

const router = express.Router();

router.route("/login").get(userController.displayLogin);

router
  .route("/signup")
  .get(userController.displaySignup)
  .post(userController.signup);

router.get("/home", userController.home);

module.exports = router;
