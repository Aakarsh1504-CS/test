const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/jobportal", { useNewUrlParser: true, useUnifiedTopology: true });
const JobPostSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Job title
  description: { type: String, required: true }, // Job description
  salary: { type: Number, required: true }, // Salary offered
  yoe: { type: Number, required: true }, // Required years of experience
  location: { type: String, required: true }, // Job location
  type: { type: String, required: true }, // Job type (e.g., Full-time, Part-time)
  email: { type: String, required: true }, // Email of the client posting the job
  metaData: { type: Object, default: {} }, // Additional metadata for flexibility
  postedAt: { type: Date, default: Date.now }, // Date when the job was posted
});

module.exports = mongoose.model("JobPost", JobPostSchema);
