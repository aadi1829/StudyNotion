const User = require("../models/User")
const mailSender = require("../utils/mailSender")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const catchAsync = require("../utils/catchAsync")
const ApiError = require("../utils/ApiError")

exports.resetPasswordToken = catchAsync(async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email })
  if (!user) {
    throw new ApiError(404, `This Email: ${email} is not Registered With Us Enter a Valid Email`)
  }
  const token = crypto.randomBytes(20).toString("hex")

  await User.findOneAndUpdate(
    { email },
    {
      token,
      resetPasswordExpires: Date.now() + 3600000,
    },
    { new: true }
  )

  const url = `${process.env.CLIENT_URL}/update-password/${token}`

  await mailSender(
    email,
    "Password Reset",
    `Your Link for email verification is ${url}. Please click this url to reset your password.`
  )

  res.status(200).json({
    success: true,
    message: "Email Sent Successfully, Please Check Your Email to Continue Further",
  })
})

exports.resetPassword = catchAsync(async (req, res) => {
  const { password, token } = req.body

  const userDetails = await User.findOne({ token })
  if (!userDetails) {
    throw new ApiError(401, "Token is Invalid")
  }
  if (!(userDetails.resetPasswordExpires > Date.now())) {
    throw new ApiError(403, "Token is Expired, Please Regenerate Your Token")
  }
  const encryptedPassword = await bcrypt.hash(password, 10)
  await User.findOneAndUpdate(
    { token },
    {
      password: encryptedPassword,
      token: null,
      resetPasswordExpires: null,
      passwordChangedAt: Date.now(),
    },
    { new: true }
  )
  res.status(200).json({
    success: true,
    message: `Password Reset Successful`,
  })
})
