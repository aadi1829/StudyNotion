// Importing necessary modules and packages
const express = require("express");
const app = express();

//routes
const userRoutes = require("./routes/user");
const profileRoutes = require("./routes/profile");
const courseRoutes = require("./routes/Course");
const paymentRoutes = require("./routes/Payments");
const contactUsRoute = require("./routes/Contact");

//config functions
const { cloudinaryConnect } = require("./config/cloudinary");

const cookieParser = require("cookie-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const helmet = require("helmet");
const morgan = require("morgan");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const dotenv = require("dotenv");
dotenv.config();

// Fail fast on boot if the server is missing something it needs,
// instead of surfacing a confusing error later on the first DB/mail/
// Cloudinary/Razorpay call.
const REQUIRED_ENV_VARS = [
	"MONGODB_URL",
	"JWT_SECRET",
	"CLIENT_URL",
	"CLOUD_NAME",
	"API_KEY",
	"API_SECRET",
	"FOLDER_NAME",
	"MAIL_HOST",
	"MAIL_USER",
	"MAIL_PASS",
	"RAZORPAY_KEY",
	"RAZORPAY_SECRET",
];

const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
	console.log(
		`Missing required environment variable(s): ${missingEnvVars.join(", ")}`
	);
	process.exit(1);
}

// Middlewares
app.use(helmet());
if (process.env.NODE_ENV !== "production") {
	app.use(morgan("dev"));
}
app.use(express.json()); //for parsing req.body
app.use(cookieParser()); //for parsing cookies
app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
	})
);
app.use(
	fileUpload({
		useTempFiles: true,
		tempFileDir: "/tmp/",
	})
);

// Connecting to cloudinary
cloudinaryConnect();

// Setting up routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

// Testing the server
app.get("/", (req, res) => {
	return res.json({
		success: true,
		message: "Your server is up and running ...",
	});
});

// Anything that didn't match a route above
app.use(notFound);

// Must be registered last - Express only treats a 4-arg middleware
// as an error handler when it comes after everything else.
app.use(errorHandler);

module.exports = app;
