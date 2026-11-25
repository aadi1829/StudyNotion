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
const validate = require("../middleware/validate")
const {
  signupSchema,
  loginSchema,
  sendOtpSchema,
  changePasswordSchema,
} = require("../validation/authValidation")
const {
  resetPasswordTokenSchema,
  resetPasswordSchema,
} = require("../validation/resetPasswordValidation")


router.post("/login", loginLimiter, validate(loginSchema), login)
router.post("/signup", signupLimiter, validate(signupSchema), signup)
router.post("/sendotp", otpLimiter, validate(sendOtpSchema), sendotp)
router.post("/changepassword", auth, validate(changePasswordSchema), changePassword)

router.post(
  "/reset-password-token",
  resetPasswordLimiter,
  validate(resetPasswordTokenSchema),
  resetPasswordToken
)
router.post("/reset-password", validate(resetPasswordSchema), resetPassword)

module.exports = router
