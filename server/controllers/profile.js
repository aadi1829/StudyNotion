const Profile = require("../models/Profile")
const CourseProgress = require("../models/CourseProgress")

const Course = require("../models/Course")
const User = require("../models/User")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const { convertSecondsToDuration } = require("../utils/secToDuration")
const catchAsync = require("../utils/catchAsync")
const ApiError = require("../utils/ApiError")

// Method for updating a profile
exports.updateProfile = catchAsync(async (req, res) => {
  const {
    firstName = "",
    lastName = "",
    dateOfBirth = "",
    about = "",
    contactNumber = "",
    gender = "",
  } = req.body
  const id = req.user.id

  const userDetails = await User.findById(id)
  const profile = await Profile.findById(userDetails.additionalDetails)

  await User.findByIdAndUpdate(id, {
    firstName,
    lastName,
  })

  // Update the profile fields
  profile.dateOfBirth = dateOfBirth
  profile.about = about
  profile.contactNumber = contactNumber
  profile.gender = gender
  await profile.save()

  // Find the updated user details
  const updatedUserDetails = await User.findById(id)
    .populate("additionalDetails")
    .exec()

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    updatedUserDetails,
  })
})

// Deletes a logged-in user's User account
// Deletes their Profile
// Removes their enrollment from all Course documents
// Deletes their Course Progress documents
exports.deleteAccount = catchAsync(async (req, res) => {
  const id = req.user.id
  const user = await User.findById(id)
  if (!user) {
    throw new ApiError(404, "User not found")
  }
  await Profile.findByIdAndDelete(user.additionalDetails)

  for (const courseId of user.courses) {
    await Course.findByIdAndUpdate(
      courseId,
      { $pull: { studentsEnroled: id } },
      { new: true }
    )
  }

  await CourseProgress.deleteMany({ userId: id })
  await User.findByIdAndDelete(id)

  res.status(200).json({
    success: true,
    message: "User and associated data deleted successfully.",
  })
})

exports.getAllUserDetails = catchAsync(async (req, res) => {
  const id = req.user.id
  const userDetails = await User.findById(id).populate("additionalDetails").exec()
  res.status(200).json({
    success: true,
    message: "User Data fetched successfully",
    data: userDetails,
  })
})

exports.updateDisplayPicture = catchAsync(async (req, res) => {
  if (!req.files?.displayPicture) {
    throw new ApiError(400, "A display picture file is required")
  }

  const displayPicture = req.files.displayPicture
  const userId = req.user.id
  const image = await uploadImageToCloudinary(
    displayPicture,
    process.env.FOLDER_NAME,
    1000,
    1000
  )
  const updatedProfile = await User.findByIdAndUpdate(
    { _id: userId },
    { image: image.secure_url },
    { new: true }
  )
  res.status(200).json({
    success: true,
    message: `Image Updated successfully`,
    data: updatedProfile,
  })
})

exports.getEnrolledCourses = catchAsync(async (req, res) => {
  const userId = req.user.id
  let userDetails = await User.findOne({
    _id: userId,
  })
    .populate({
      path: "courses",
      populate: {
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      },
    })
    .exec()

  if (!userDetails) {
    throw new ApiError(400, `Could not find user with id: ${userId}`)
  }

  userDetails = userDetails.toObject()
  var SubsectionLength = 0
  for (var i = 0; i < userDetails.courses.length; i++) {
    let totalDurationInSeconds = 0
    SubsectionLength = 0
    for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
      totalDurationInSeconds += userDetails.courses[i].courseContent[
        j
      ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
      userDetails.courses[i].totalDuration = convertSecondsToDuration(
        totalDurationInSeconds
      )
      SubsectionLength +=
        userDetails.courses[i].courseContent[j].subSection.length
    }
    let courseProgressCount = await CourseProgress.findOne({
      courseID: userDetails.courses[i]._id,
      userId: userId,
    })
    courseProgressCount = courseProgressCount?.completedVideos.length
    if (SubsectionLength === 0) {
      userDetails.courses[i].progressPercentage = 100
    } else {
      // To make it up to 2 decimal point
      const multiplier = Math.pow(10, 2)
      userDetails.courses[i].progressPercentage =
        Math.round(
          (courseProgressCount / SubsectionLength) * 100 * multiplier
        ) / multiplier
    }
  }

  return res.status(200).json({
    success: true,
    data: userDetails.courses,
  })
})

exports.instructorDashboard = catchAsync(async (req, res) => {
  const courseDetails = await Course.find({ instructor: req.user.id })

  const courseData = courseDetails.map((course) => {
    const totalStudentsEnrolled = course.studentsEnroled.length
    const totalAmountGenerated = totalStudentsEnrolled * course.price

    return {
      _id: course._id,
      courseName: course.courseName,
      courseDescription: course.courseDescription,
      totalStudentsEnrolled,
      totalAmountGenerated,
    }
  })

  res.status(200).json({
    success: true,
    courses: courseData,
  })
})
