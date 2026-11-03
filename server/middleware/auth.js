const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/User");
dotenv.config();

// This function is used as middleware to authenticate user requests
exports.auth = async (req, res, next) => {
	try {
		const authHeader = req.header("Authorization");
		const token =
			req.cookies.token ||
			req.body.token ||
			(authHeader ? authHeader.replace("Bearer ", "") : null);

		if (!token) {
			return res.status(401).json({ success: false, message: `Token Missing` });
		}

		let decode;
		try {
			decode = await jwt.verify(token, process.env.JWT_SECRET);
		} catch (error) {
			return res
				.status(401)
				.json({ success: false, message: "token is invalid" });
		}

		// If the password was changed after this token was issued, the
		// token should no longer work. This is how a password change
		// logs out every other session that was using an older token.
		const user = await User.findById(decode.id);
		if (!user) {
			return res.status(401).json({ success: false, message: "User no longer exists" });
		}

		if (user.passwordChangedAt) {
			const passwordChangedAtInSeconds = Math.floor(user.passwordChangedAt.getTime() / 1000);
			if (decode.iat < passwordChangedAtInSeconds) {
				return res.status(401).json({
					success: false,
					message: "Password was changed recently. Please login again.",
				});
			}
		}

		req.user = decode;
		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: `Something Went Wrong While Validating the Token`,
		});
	}
};

// The JWT payload already carries accountType (see Auth.js login),
// so these just read it off req.user instead of hitting the database again.
exports.isStudent = async (req, res, next) => {
	if (req.user.accountType !== "Student") {
		return res.status(401).json({
			success: false,
			message: "This is a Protected Route for Students",
		});
	}
	next();
};

exports.isAdmin = async (req, res, next) => {
	if (req.user.accountType !== "Admin") {
		return res.status(401).json({
			success: false,
			message: "This is a Protected Route for Admin",
		});
	}
	next();
};

exports.isInstructor = async (req, res, next) => {
	if (req.user.accountType !== "Instructor") {
		return res.status(401).json({
			success: false,
			message: "This is a Protected Route for Instructor",
		});
	}
	next();
};
