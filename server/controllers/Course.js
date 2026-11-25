const Course = require("../models/Course")
const Category = require("../models/Category")
const Section = require("../models/Section")
const SubSection = require("../models/Subsection")
const RatingAndReview = require("../models/RatingandReview")
const User = require("../models/User")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const CourseProgress = require("../models/CourseProgress")
const { convertSecondsToDuration } = require("../utils/secToDuration")
const catchAsync = require("../utils/catchAsync")
const ApiError = require("../utils/ApiError")

// The frontend sends these as a stringified JSON array (it's a
// multipart form, so every field arrives as a string). Parsing is kept
// out of the Joi schema (which only confirms the string is present) so
// a malformed JSON string gets a clean 400 instead of an unhandled
// SyntaxError.
function parseJsonArray(value, fieldName) {
  let parsed
  try {
    parsed = JSON.parse(value)
  } catch (error) {
    throw new ApiError(400, `${fieldName} must be valid JSON`)
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new ApiError(400, `${fieldName} must be a non-empty array`)
  }
  return parsed
}

// Function to create a new course
exports.createCourse = catchAsync(async (req, res) => {
  const userId = req.user.id

  const {
    courseName,
    courseDescription,
    whatYouWillLearn,
    price,
    tag: _tag,
    category,
    status,
    instructions: _instructions,
  } = req.body

  const thumbnail = req.files?.thumbnailImage
  if (!thumbnail) {
    throw new ApiError(400, "A course thumbnail image is required")
  }

  const tag = parseJsonArray(_tag, "tag")
  const instructions = parseJsonArray(_instructions, "instructions")

  // Check if the user is an instructor
  const instructorDetails = await User.findOne({
    _id: userId,
    accountType: "Instructor",
  })

  if (!instructorDetails) {
    throw new ApiError(404, "Instructor Details Not Found")
  }

  const categoryDetails = await Category.findById(category)
  if (!categoryDetails) {
    throw new ApiError(404, "Category Details Not Found")
  }
  // Upload the Thumbnail to Cloudinary
  const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME)

  if (!thumbnailImage) {
    throw new ApiError(500, "Image Upload Failed")
  }

  // Create a new course with the given details
  const newCourse = await Course.create({
    courseName,
    courseDescription,
    instructor: instructorDetails._id,
    whatYouWillLearn,
    price,
    tag,
    category: categoryDetails._id,
    thumbnail: thumbnailImage.secure_url,
    status: status || "Draft",
    instructions,
  })

  // Add the new course to the User Schema of the Instructor
  await User.findByIdAndUpdate(
    instructorDetails._id,
    {
      $push: {
        courses: newCourse._id,
      },
    },
    { new: true }
  )
  // Add the new course to the Categories
  await Category.findByIdAndUpdate(
    category,
    {
      $push: {
        courses: newCourse._id,
      },
    },
    { new: true }
  )

  // Return the new course and a success message
  res.status(200).json({
    success: true,
    data: newCourse,
    message: "Course Created Successfully",
  })
})

// Edit Course Details
exports.editCourse = catchAsync(async (req, res) => {
  const { courseId } = req.body
  const course = await Course.findById(courseId)

  if (!course) {
    throw new ApiError(404, "Course not found")
  }

  // Only the instructor who owns this course is allowed to edit it
  if (course.instructor.toString() !== req.user.id) {
    throw new ApiError(403, "You are not allowed to edit this course")
  }

  // If Thumbnail Image is found, update it
  if (req.files?.thumbnailImage) {
    const thumbnail = req.files.thumbnailImage
    const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME)
    if (!thumbnailImage?.secure_url) {
      throw new ApiError(500, "Image upload failed")
    }
    course.thumbnail = thumbnailImage.secure_url
  }

  // Only let these fields be changed through this route.
  // This stops someone from sneaking in other fields (like "instructor")
  // through the request body.
  const allowedFields = [
    "courseName",
    "courseDescription",
    "whatYouWillLearn",
    "price",
    "tag",
    "category",
    "status",
    "instructions",
  ]

  for (const field of allowedFields) {
    const value = req.body[field]

    if (value === undefined) {
      continue
    }

    if (field === "tag" || field === "instructions") {
      course[field] = parseJsonArray(value, field)
    } else {
      course[field] = value
    }
  }

  await course.save()

  const updatedCourse = await Course.findOne({
    _id: courseId,
  })
    .populate({
      path: "instructor",
      populate: {
        path: "additionalDetails",
      },
    })
    .populate("category")
    .populate("ratingAndReviews")
    .populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    })
    .exec()

  res.status(200).json({
    success: true,
    message: "Course updated successfully",
    data: updatedCourse,
  })
})

// Get Course List
exports.getAllCourses = catchAsync(async (req, res) => {
  const allCourses = await Course.find(
    { status: "Published" },
    {
      //Projection : only these fields of a particular course to be fetched
      courseName: true,
      price: true,
      thumbnail: true,
      instructor: true,
      ratingAndReviews: true,
      studentsEnrolled: true,
    }
  )
    .populate("instructor")
    .exec()

  return res.status(200).json({
    success: true,
    data: allCourses,
  })
})

// Get One Single Course Details
exports.getCourseDetails = catchAsync(async (req, res) => {
  const { courseId } = req.body
  const courseDetails = await Course.findOne({
    _id: courseId,
  })
    .populate({
      path: "instructor",
      populate: {
        path: "additionalDetails",
      },
    })
    .populate("category")
    .populate("ratingAndReviews")
    .populate({
      path: "courseContent",
      populate: {
        path: "subSection",
        select: "-videoUrl",
      },
    })
    .exec()

  if (!courseDetails) {
    throw new ApiError(404, `Could not find course with id: ${courseId}`)
  }

  let totalDurationInSeconds = 0
  courseDetails.courseContent.forEach((section) => {
    section.subSection.forEach((subSection) => {
      const timeDurationInSeconds = parseInt(subSection.timeDuration)
      totalDurationInSeconds += timeDurationInSeconds
    })
  })

  const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

  return res.status(200).json({
    success: true,
    data: {
      courseDetails,
      totalDuration,
    },
  })
})

exports.getFullCourseDetails = catchAsync(async (req, res) => {
  const { courseId } = req.body
  const userId = req.user.id
  const courseDetails = await Course.findOne({
    _id: courseId,
  })
    .populate({
      path: "instructor",
      populate: {
        path: "additionalDetails",
      },
    })
    .populate("category")
    .populate("ratingAndReviews")
    .populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    })
    .exec()

  if (!courseDetails) {
    throw new ApiError(404, `Could not find course with id: ${courseId}`)
  }

  const courseProgressCount = await CourseProgress.findOne({
    courseID: courseId,
    userId: userId,
  })

  let totalDurationInSeconds = 0
  courseDetails.courseContent.forEach((content) => {
    content.subSection.forEach((subSection) => {
      const timeDurationInSeconds = parseInt(subSection.timeDuration)
      totalDurationInSeconds += timeDurationInSeconds
    })
  })

  const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

  return res.status(200).json({
    success: true,
    data: {
      courseDetails,
      totalDuration,
      completedVideos: courseProgressCount?.completedVideos
        ? courseProgressCount?.completedVideos
        : [],
    },
  })
})

// Get a list of Course for a given Instructor
exports.getInstructorCourses = catchAsync(async (req, res) => {
  const instructorId = req.user.id

  const instructorCourses = await Course.find({
    instructor: instructorId,
  }).sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    data: instructorCourses,
  })
})

// Delete the Course
exports.deleteCourse = catchAsync(async (req, res) => {
  const { courseId } = req.body
  const userId = req.user.id

  // Find the course
  const course = await Course.findById(courseId)
  if (!course) {
    throw new ApiError(404, "Course not found")
  }

  // Only the instructor who owns this course is allowed to delete it
  if (course.instructor.toString() !== userId) {
    throw new ApiError(403, "You are not allowed to delete this course")
  }

  // Unenroll students from the course
  const studentsEnrolled = course.studentsEnroled
  for (const studentId of studentsEnrolled) {
    await User.findByIdAndUpdate(studentId, {
      $pull: { courses: courseId },
    })
  }

  // Delete sections and sub-sections
  const courseSections = course.courseContent
  for (const sectionId of courseSections) {
    // Delete sub-sections of the section
    const section = await Section.findById(sectionId)
    if (section) {
      const subSections = section.subSection
      for (const subSectionId of subSections) {
        await SubSection.findByIdAndDelete(subSectionId)
      }
    }

    // Delete the section
    await Section.findByIdAndDelete(sectionId)
  }

  await Category.findByIdAndUpdate(course.category, {
    $pull: { courses: courseId },
  })

  await CourseProgress.deleteMany({ courseID: courseId })
  await RatingAndReview.deleteMany({ course: courseId })

  // Delete the course
  await Course.findByIdAndDelete(courseId)

  return res.status(200).json({
    success: true,
    message: "Course deleted successfully",
  })
})
