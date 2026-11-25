const bcrypt = require("bcrypt")
const User = require("../models/User")
const OTP = require("../models/OTP")
const jwt = require("jsonwebtoken")
const otpGenerator = require("otp-generator")
const mailSender = require("../utils/mailSender")
const { passwordUpdated } = require("../mail/templates/passwordUpdate")
const Profile = require("../models/Profile")
const catchAsync = require("../utils/catchAsync")
const ApiError = require("../utils/ApiError")
require("dotenv").config()

// How long a login session lasts. The JWT and its cookie should always
// use the same value, so a cookie never outlives (or expires before) the
// token it is holding.
const TOKEN_EXPIRY_HOURS = 24

// Signup Controller for Registering USers
exports.signup = catchAsync(async (req, res) => {
  const { firstName, lastName, email, password, accountType, otp } = req.body

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new ApiError(400, "User already exists. Please sign in to continue.")
  }

  const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1) //most recent otp
  if (response.length === 0 || otp !== response[0].otp) {
    throw new ApiError(400, "The OTP is not valid")
  }

  const hashedPassword = await bcrypt.hash(password, 10) //hash password

  let approved = ""
  approved === "Instructor" ? (approved = false) : (approved = true)

  // Create the Additional Profile For User
  const profileDetails = await Profile.create({
    gender: null,
    dateOfBirth: null,
    about: null,
    contactNumber: null,
  })

  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    accountType,
    approved,
    additionalDetails: profileDetails._id,
    image: "",
  })

  return res.status(200).json({
    success: true,
    user,
    message: "User registered successfully",
  })
})

// Login controller for authenticating users
exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).populate("additionalDetails")

  if (!user) {
    throw new ApiError(401, "User is not Registered with Us Please SignUp to Continue")
  }

  if (!(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, "Password is incorrect")
  }

  const token = jwt.sign(
    { email: user.email, id: user._id, accountType: user.accountType },
    process.env.JWT_SECRET,
    {
      expiresIn: `${TOKEN_EXPIRY_HOURS}h`,
    }
  )

  user.token = token
  user.password = undefined

  // Set cookie for token and return success response
  const options = {
    expires: new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000),
    httpOnly: true,
  }
  res.cookie("token", token, options).status(200).json({
    success: true,
    token,
    user,
    message: `User Login Success`,
  })
})

// Send OTP For Email Verification
exports.sendotp = catchAsync(async (req, res) => {
  const { email } = req.body

  const checkUserPresent = await User.findOne({ email })

  if (checkUserPresent) {
    throw new ApiError(401, "User is Already Registered")
  }

  var otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  })

  let result = await OTP.findOne({ otp: otp })
  while (result) {
    otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    })
    result = await OTP.findOne({ otp: otp }) // Update result with new OTP
  }
  const otpPayload = { email, otp }
  await OTP.create(otpPayload)
  res.status(200).json({
    success: true,
    message: `OTP Sent Successfully`,
  })
})

// Controller for Changing Password
exports.changePassword = catchAsync(async (req, res) => {
  const userDetails = await User.findById(req.user.id)
  const { oldPassword, newPassword } = req.body

  const isPasswordMatch = await bcrypt.compare( //validate password
    oldPassword,
    userDetails.password
  )
  if (!isPasswordMatch) {
    throw new ApiError(401, "The password is incorrect")
  }

  // Update password
  const encryptedPassword = await bcrypt.hash(newPassword, 10)
  const updatedUserDetails = await User.findByIdAndUpdate(
    req.user.id,
    { password: encryptedPassword, passwordChangedAt: Date.now() },
    { new: true }
  )

  // Every token issued before this point is now invalid (see the auth
  // middleware's passwordChangedAt check), so give this session a fresh
  // token instead of logging the user out of the device they are on.
  const newToken = jwt.sign(
    {
      email: updatedUserDetails.email,
      id: updatedUserDetails._id,
      accountType: updatedUserDetails.accountType,
    },
    process.env.JWT_SECRET,
    { expiresIn: `${TOKEN_EXPIRY_HOURS}h` }
  )

  // Send notification email
  await mailSender(
    updatedUserDetails.email,
    "Password for your account has been updated",
    passwordUpdated(
      updatedUserDetails.email,
      `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
    )
  )

  return res.status(200).json({
    success: true,
    message: "Password updated successfully",
    token: newToken,
  })
})
