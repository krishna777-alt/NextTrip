const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const Admin = require('./../Models/adminModel');

//////////////////////////////////////////////////////////////ADMIN AUTH///////////////////////////////

exports.auth = (req,res,next)=> {
  const token = req.cookies.jwt;
  console.log('token:',token);
  if(!token)
    {
      return res.status(401).json({message:'You are not logged in!'});
    } 
  try{
    const decode = jwt.verify(token,process.env.JWT_SECRET_KEY);
    console.log('decode: ',decode);
    req.admin = decode;
    next();
  }  
  catch(err){
    return res.status(403).json({message:'Invalid Token!'+err});
  }
}
exports.isAdmin = async(req,res,next)=>{
  if(req.admin.role !== "admin"){
    return res.status(403).send("Access Denied. Admins only");
  }
  // console.log('admin ID:'+req.admin.id,'admin role:'+req.admin.role);
  const currentAdmin = await Admin.findById(req.admin.id);
  console.log(currentAdmin);
  req.adminData = currentAdmin;
  next();
}

exports.getLogin = (req,res)=>{
    try{
        // res.sendFile(path.join(__dirname,'../templets','admin','login.ejs'));
        // res.redirect("/api/v1/admin/login");
            res.render("admin/login", {
          successMsg: req.flash("success"),
          errorMsg: req.flash("error")
        });
    }catch(err){
        res.sendFile(path.join(__dirname,'../templets','status','404.html'));
    }
}

exports.logout = (req,res)=>{
  res.clearCookie("jwt");
  return res.redirect('/api/v1/admin/login');
}
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find admin by email
    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      req.flash("error", "Admin not found");
      return res.redirect("/api/v1/admin/login");
    }

    // 2. Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, admin.password);

    if (!isPasswordMatch) {
      return res.status(401).send("Invalid credentials");
    }
    //3. creating jwt token
    const token = jwt.sign(
      {
        id:admin._id,
        role:admin.role
      },
      process.env.JWT_SECRET_KEY,
      // {expresIn:process.env.JWT_TOKEN_EXPRIES} 
     { expiresIn: process.env.JWT_TOKEN_EXPRIES }

    )
    
    //4.Stores token in cookie
    res.cookie('jwt',token,{
      httpOnly:true,
      secure:false,
      maxAge:24 * 60 * 60 * 1000
    });
    //5. Success -> Redirect to admin dashboard
    return res.redirect("/api/v1/admin/");
  //   return res.render("admin/home", {
  //   successMsg: req.flash("success")
  // });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    return res
      .status(500)
      .json({ERROR:err});
      // .sendFile(path.join(__dirname, "../templets/status/404.html"));
  }
};
////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

exports.adminHome = (req,res)=>{
    try{
        // res.status(200).sendFile(path.join(__dirname,'../templets','admin','home.ejs'));
        return res.render("admin/home", {
        admin: req.adminData, 
        successMsg: req.flash("success")
      });
    }catch(err){
        res.status(404).json({
            message:'Failed '+err
        });
    }
}

exports.getManageAdmin2 = (req,res)=>{
    try{
        res.status(200).sendFile(path.join(__dirname,'../templets','admin','manage-admin.ejs'));
    }
    catch(err){
        res.status(404).json({
            message:'Failed'+err
        });
    }
}
exports.getManageAdmin = (req, res) => {
  res.render("admin/manage-admin", {
    successMsg: req.flash("success")
  });
};
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads', 'adminProfiles'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// FILE FILTER (optional)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new Error("Only images allowed"), false);
};

const upload = multer({ storage, fileFilter });

// MATCHES THE HTML FIELD NAME ↓↓↓
exports.uploadAdminImage = upload.single('image');

exports.createAdmin = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "No profile image uploaded!"
      });
    }

    const admin = await Admin.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      image: req.file.filename   // << Correct
    });
    await admin.save();

    req.flash('success','Admin created successfully!');
    res.redirect('http://localhost:3000/api/v1/admin/manage-admin');
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
      message: err.message
    });
  }
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

        res.redirect("/manage-admin");  // redirect after update
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error"+err);
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


exports.getAllAdmin = async (req,res)=>{
    try{
        const admins = await Admin.find();
        res.status(200).json(admins);
    }catch(err){
        console.log(err);
    }
}