const rateLimit = require("express-rate-limit")

// Limits how many times someone can try to log in from the same IP.
// This makes it much harder to brute-force a password.
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
})

// Limits how many OTPs someone can request from the same IP.
// Without this, someone could spam a person's inbox with OTP emails.
exports.otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again after 15 minutes.",
  },
})

// Limits how many accounts can be created from the same IP.
exports.signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: "Too many accounts created from this IP. Please try again later.",
  },
})

// Limits how many password reset emails can be requested from the same IP.
exports.resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many password reset requests. Please try again after 15 minutes.",
  },
})
