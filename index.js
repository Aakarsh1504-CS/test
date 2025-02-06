
const express = require("express");
const app = express();
const path = require("path");
const cookieparser = require("cookie-parser");
const usm = require("./models/Jobseeker");
const psm = require("./models/Jobpost");
const multer = require("multer");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config();
mongoose.connect(`${process.env.MONGO_URI}`, { useNewUrlParser: true, useUnifiedTopology: true });
const port = process.env.port || 3000;
const nodemailer = require("nodemailer");

// Configure mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Change this if using another email provider
  auth: {
    user: process.env.EMAIL, // Sender email
    pass: process.env.PASSWORD, // Use an App Password if using Gmail
  },
});

const sendMail = async (subject, message, recipientEmail) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL,
        to: recipientEmail,
        subject: subject,
        text: message,
      };
  
      // Send the email
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };
// Middleware for cache control
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// Setting up the view engine
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieparser());

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB size limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "application/pdf") {
            return cb(new Error("Only PDF files are allowed"), false);
        }
        cb(null, true);
    },
});

// Register route


// Basic landing page
app.get("/",  async (req, res, next) => {
    res.render("profile");
});

// Upload CV route
app.post("/uploadCvBy", async (req, res, next) => {
    try {
        const {  email, curr_salary, curr_yoe, curr_location, pref_type, skills,cv } = req.body;
        

        // Find or create user and update details
        let user = await usm.findOne({ email });
        if (!user) {
            user = new usm({
                email,
                curr_salary,
                curr_yoe,
                curr_location,
                pref_type,
                skills,
                resume: cv,
            });
        } else {
            user.curr_salary = curr_salary;
            user.curr_yoe = curr_yoe;
            user.curr_location = curr_location;
            user.pref_type = pref_type;
            user.skills = skills;
            user.resume = cv;
        }

        await user.save();
        res.redirect("/");
    } catch (err) {
        next(err);
    }
});


// Post job route
app.post("/postJobByClient", async (req, res, next) => {
    try {
        const { title, email, description, salary, yoe, location, type } = req.body;

        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            const error = new Error("Invalid email format. Please provide a valid email.");
            error.status = 400;
            throw error;
        }

        console.log(req.body);

        // Create a job post if validation passes
        await psm.create({
            title,
            email,
            description,
            salary,
            yoe,
            location,
            type,
        });

        res.redirect("/profile");
    } catch (err) {
        next(err); // Pass the error to the error handler middleware
    }
});



// Render the upload CV page
app.get("/uploadCv", (req, res, next) => {
    res.render("uploadCv");
});

// Render the post job page
app.get("/postJob", (req, res, next) => {
    res.render("postJob");
});

app.post("/contact", (req, res, next) => {
    let {name , email , message } = req.body;
    message+=` recieved by ${email}`;
    sendMail("New Enquiry Recieved",message,process.env.SEMAIL);
    const emailBody = `
  Dear ${name},

  Thank you for getting in touch with us! We appreciate your interest in our services, and we are excited about the opportunity to assist you.

  Our team is currently reviewing your query, and we will get back to you as soon as possible with more details. We understand the importance of your request and are committed to providing you with the best possible solution tailored to your needs.

  In the meantime, please feel free to reach out if you have any questions or need further information. We look forward to working with you and are confident that you'll be pleased with the results of choosing us.

  Best regards,
  Shivam Rathore
  Delivery Head
  CV Solutions
  9528744397
`;
    sendMail("Thank You for Reaching Out to Us!", emailBody,email );
    res.redirect("/");
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error
    res.status(err.status || 500);
    res.render("error", {
        message: err.message || "Something went wrong!",
        status: err.status || 500,
    });
})
// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

