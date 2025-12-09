const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const path = require("path");
const dotenv = require("dotenv");

const adminRoute = require("./Routes/adminRoute");
const hotelRoute = require("./Routes/HotelRoute");
const userRoute = require("./Routes/userRoute");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templets"));

dotenv.config({ path: "./config.env" });

app.use(cookieParser());
app.set("view engine", "ejs");
// app.set('views', './templets/admin');

app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});
app.use(express.static(path.join(__dirname, "templets")));
app.use("/uploads", express.static("uploads"));
app.use("/images", express.static("images"));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json());
// app.use('./uploads', express.static('uploads'));

app.use(express.static(`${__dirname}/templets`));

app.use("/admin", adminRoute);
app.use("/hotel", hotelRoute);
app.use("/", userRoute);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

module.exports = app;
