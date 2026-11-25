require("./testEnv")

const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { MongoMemoryServer } = require("mongodb-memory-server")

const User = require("../models/User")
const Profile = require("../models/Profile")
const OTP = require("../models/OTP")

let mongoServer

async function startDb() {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
}

async function stopDb() {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
  await mongoServer.stop()
}

async function clearDb() {
  const { collections } = mongoose.connection
  for (const name of Object.keys(collections)) {
    await collections[name].deleteMany({})
  }
}

// Creates a user directly in the DB, bypassing the signup endpoint - used
// by tests that need a ready-made fixture (an instructor, a student) and
// aren't themselves testing the signup flow.
async function createUser({ accountType, email, password = "Password123" }) {
  const profile = await Profile.create({
    gender: null,
    dateOfBirth: null,
    about: null,
    contactNumber: null,
  })
  const hashedPassword = await bcrypt.hash(password, 10)
  return User.create({
    firstName: "Test",
    lastName: accountType,
    email,
    password: hashedPassword,
    accountType,
    additionalDetails: profile._id,
    image: "",
  })
}

function tokenFor(user) {
  return jwt.sign(
    { email: user.email, id: user._id.toString(), accountType: user.accountType },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  )
}

// Inserts an OTP doc via the raw collection, bypassing the OTP model's
// pre-save hook that would otherwise try to send a real verification email.
async function seedOtp(email, otp) {
  await OTP.collection.insertOne({ email, otp, createdAt: new Date() })
}

module.exports = { startDb, stopDb, clearDb, createUser, tokenFor, seedOtp }
