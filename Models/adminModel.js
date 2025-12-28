const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
    name:String,
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
        select:false,
    },
    role:{
        type:String,
        default:"admin"
    },
    account:{
        type:Number,
        default:0
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    image:String
});


AdminSchema.pre('save', async function (next) {

    //   If password is NOT changed, skip hashing
    if (!this.isModified('password')) {
        return next();
    }
// alert('here');
  // Hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

const Admin = mongoose.model('Admin',AdminSchema);
module.exports = Admin;