const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    days:{
        type:Number,
        default:2,
    },
    nights:{
        type:Number,
        default:2
    },

    includes: [String],
    excludes: [String],

    images: {
        type: String,
        required: true
    },

    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Agent",
        required: true
    },

    status: {
        type: String,
        default: "live"  // instantly live on website
    },

}, { timestamps: true });

const Package = mongoose.model("Package", packageSchema);
module.exports = Package;