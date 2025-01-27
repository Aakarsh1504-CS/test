const express = require("express");
const app = express();
const path = require("path");
const cookieparser = require("cookie-parser");
const usm = require("./models/Jobseeker");
const psm = require("./models/Jobpost");
const multer = require("multer");
const dotenv = require("dotenv");

dotenv.config();

const port = process.env.port || 3000;

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
app.post("/register", async (req, res, next) => {
    try {
        let { email, role } = req.body;
        role = role.trim();
        email = email.trim();

        const user = await usm.create({ email, role });

        if (role === "seeker") res.redirect("/uploadCv");
        else if (role === "employer") res.redirect("/postJob");
    } catch (err) {
        next(err);
    }
});

// Basic landing page
app.get("/profile",  async (req, res, next) => {
    res.render("profile");
});

// Upload CV route
app.post("/uploadCvBy", upload.single("pdf"), async (req, res, next) => {
    try {
        const { name, email, curr_salary, curr_yoe, curr_location, pref_type, skills } = req.body;

        if (!req.file) {
            return res.status(400).send("No file uploaded. Please upload a PDF file.");
        }

        // Find or create user and update details
        let user = await usm.findOne({ email });
        if (!user) {
            user = new usm({
                name,
                email,
                curr_salary,
                curr_yoe,
                curr_location,
                pref_type,
                skills,
                resume: {
                    data: req.file.buffer,
                    contentType: req.file.mimetype,
                    originalName: req.file.originalname,
                },
            });
        } else {
            user.curr_salary = curr_salary;
            user.curr_yoe = curr_yoe;
            user.curr_location = curr_location;
            user.pref_type = pref_type;
            user.skills = skills;
            user.resume = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
                originalName: req.file.originalname,
            };
        }

        await user.save();
        res.redirect("/profile");
    } catch (err) {
        next(err);
    }
});

// Post job route
app.post("/postJob", async (req, res, next) => {
    try {
        const { title, email, description, salary, yoe, location, type } = req.body;

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
        next(err);
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.render("error", { err: err.message });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
