const express = require("express")
const router = express.Router()

const {login,signup,sendotp,changePassword} = require("../controllers/Auth")
const {resetPasswordToken,resetPassword} = require("../controllers/resetPassword")

const { auth } = require("../middleware/auth")
const {
  loginLimiter,
  otpLimiter,
  signupLimiter,
  resetPasswordLimiter,
} = require("../middleware/rateLimiter")


router.post("/login", loginLimiter, login)
router.post("/signup", signupLimiter, signup)
router.post("/sendotp", otpLimiter, sendotp)
router.post("/changepassword", auth, changePassword)

router.post("/reset-password-token", resetPasswordLimiter, resetPasswordToken)
router.post("/reset-password", resetPassword)

module.exports = router
