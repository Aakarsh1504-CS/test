const mongoose = require("mongoose");

const JobseekerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // Ensures email uniqueness
  curr_salary: { type: Number, default: 0 }, // Current salary
  curr_yoe: { type: Number, default: 0 }, // Current years of experience
  curr_location: { type: String, default: "" }, // Current location
  pref_type: { type: String, default: "" }, // Preferred job type
  skills: { type: [String], default: [] }, // Array of skills
  resume: {type:String,default: ""}, // Resume
  uploadedAt: { type: Date, default: Date.now }, // Date when the resume was uploaded
});

module.exports = mongoose.model("Jobseeker", JobseekerSchema);
