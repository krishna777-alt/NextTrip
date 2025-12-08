const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const Package = require("./../Models/packageModel");
const Agent = require("./../Models/agentModel");

// exports.auth = (req,res,next)=>{

// }
exports.logout = function (req, res) {
  res.clearCookie("jwt");
  return res.redirect("/api/v1/agent/login");
};
exports.auth = function (req, res, next) {
  const token = req.cookies.jwt;
  // console.log(token);
  if (!token) {
    //    return res.status(401).json({
    //         status:401,
    //         message:'You are not logged in! Pelase loggin'
    //     });
    return res.redirect("/api/v1/agent/login");
  }
  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // console.log(decode);
    req.agent = decode;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid Token!" + err });
  }
};
exports.isAgent = async function (req, res, next) {
  if (req.agent.role !== "agent") {
    return res.status(403).json({
      message: "Access Denied! Agents only",
    });
  }
  const currentAgent = await Agent.findById(req.agent.id);
  // console.log(currentAgent);
  req.agentData = currentAgent;

  next();
};
exports.getLogin = (req, res) => {
  const success = req.flash("success");
  res.render("agents/login", { success });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      req.flash("err", "Please provide email and password");
      return res.redirect("/api/v1/agent/login");
    }
    const agent = await Agent.findOne({ email }).select("+password");

    if (!agent) {
      req.flash("err", "Agent not found!");
      return res.redirect("/api/v1/agent/login");
    }

    const checkPassword = await bcrypt.compare(password, agent.password);
    // console.log(checkPassword);
    if (!checkPassword) {
      req.flash("err", "Invalid password or email");
      return res.redirect("/api/v1/agent/login");
    }
    const token = jwt.sign(
      {
        id: agent._id,
        role: agent.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.JWT_TOKEN_EXPRIES }
    );
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.redirect("/api/v1/agent/");
    res.status(201).json({
      agent,
      token,
    });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    return res.status(500).json({ ERROR: err });
  }
};

exports.getRegister = (req, res) => {
  res.render("agents/register");
};

exports.register = async (req, res) => {
  try {
    if (!req.body) {
      res.send("error");
    }
    const { fullName, email, phone, company, password } = req.body;
    const agent = new Agent({
      name: fullName,
      email,
      password,
      phone,
      companyName: company,
    });

    await agent.save();

    req.flash(
      "success",
      `
            successfully account registered    
            `
    );
    return res.redirect("http://localhost:3000/api/v1/agent/login");
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
exports.getAgent = (req, res) => {
  res.render("agents/home");
};

exports.getAddPackage = (req, res) => {
  res.render("agents/addPackage");
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads", "packages"));
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
exports.uploadPackageImage = upload.single("image");

exports.addPackage = async function (req, res) {
  try {
    const package = new Package({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      location: req.body.location,
      days: req.body.days,
      nights: req.body.nights,
      includes: req.body.includes,
      excludes: req.body.excludes,
      images: req.file.filename,
      agentId: req.agent.id,
    });
    await package.save();

    req.flash("success", "Place successfully added");
    return res.redirect("http://localhost:3000/api/v1/agent/addPackage");
    res.status(201).json({
      message: "success",
      file: req.file,
      package,
    });
  } catch (err) {
    console.log("Error:" + err);
  }
};

exports.displayAgentPackage = async function (req, res) {
  try {
    const agentId = req.agent.id;
    const packages = await Package.find({ agentId });
    console.log(packages);
    res.render("agents/myPackage", { packages });
  } catch (err) {
    console.log("ERROR" + err);
  }
};

exports.agentProfile = function (req, res) {
  res.render("agents/agentProfile");
};
