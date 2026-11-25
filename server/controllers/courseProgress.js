const SubSection = require("../models/Subsection")
const CourseProgress = require("../models/CourseProgress")
const Course = require("../models/Course")
const catchAsync = require("../utils/catchAsync")
const ApiError = require("../utils/ApiError")

exports.updateCourseProgress = catchAsync(async (req, res) => {
  const { courseId, subsectionId } = req.body
  const userId = req.user.id

  // Check if the subsection is valid
  const subsection = await SubSection.findById(subsectionId)
  if (!subsection) {
    throw new ApiError(404, "Subsection not found")
  }

  // Make sure the subsection actually belongs to the given course,
  // not just that it exists somewhere in the database.
  const course = await Course.findById(courseId).populate("courseContent")
  const belongsToCourse = course?.courseContent?.some((section) =>
    section.subSection.some((id) => id.toString() === subsectionId)
  )
  if (!belongsToCourse) {
    throw new ApiError(400, "This subsection does not belong to the given course")
  }

  let courseProgress = await CourseProgress.findOne({
    courseID: courseId,
    userId: userId,
  })

  if (!courseProgress) {
    throw new ApiError(404, "Course progress Does Not Exist")
  }

  // If course progress exists, check if the subsection is already completed
  if (courseProgress.completedVideos.includes(subsectionId)) {
    throw new ApiError(409, "This subsection is already marked as completed.")
  }
  courseProgress.completedVideos.push(subsectionId)
  await courseProgress.save()

  return res.status(200).json({
    success: true,
    message: "Course progress updated",
    data: courseProgress,
  })
})
