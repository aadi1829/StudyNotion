const Section = require("../models/Section")
const Course = require("../models/Course")
const SubSection = require("../models/Subsection")
const catchAsync = require("../utils/catchAsync")
const ApiError = require("../utils/ApiError")

// Loads the course and checks the requesting instructor owns it,
// mirroring the same check already enforced on editCourse/deleteCourse
// in Course.js. Without this, any instructor could add, edit or
// delete sections on a course that isn't theirs.
async function assertOwnsCourse(courseId, userId) {
  const course = await Course.findById(courseId)
  if (!course) {
    throw new ApiError(404, "Course not found")
  }
  if (course.instructor.toString() !== userId) {
    throw new ApiError(403, "You are not allowed to modify this course")
  }
  return course
}

// CREATE a new section
exports.createSection = catchAsync(async (req, res) => {
  const { sectionName, courseId } = req.body

  await assertOwnsCourse(courseId, req.user.id)

  const newSection = await Section.create({ sectionName }) //create new section
  const updatedCourse = await Course.findByIdAndUpdate(
    courseId,
    {
      $push: {
        courseContent: newSection._id,
      },
    },
    { new: true }
  ).populate({
    path: "courseContent",
    populate: {
      path: "subSection",
    },
  })

  return res.status(200).json({
    success: true,
    message: `Section '${sectionName}' created and linked to course.`,
    updatedCourse,
  })
})

// UPDATE a section
exports.updateSection = catchAsync(async (req, res) => {
  const { sectionName, sectionId, courseId } = req.body

  await assertOwnsCourse(courseId, req.user.id)

  const updatedSection = await Section.findByIdAndUpdate(
    sectionId,
    { sectionName },
    { new: true }
  )

  if (!updatedSection) {
    throw new ApiError(404, "Section not found")
  }

  const updatedCourse = await Course.findById(courseId).populate({
    path: "courseContent",
    populate: {
      path: "subSection",
    },
  })

  res.status(200).json({
    success: true,
    message: "Section updated successfully",
    section: updatedSection,
    course: updatedCourse,
  })
})

// DELETE a section
exports.deleteSection = catchAsync(async (req, res) => {
  const { sectionId, courseId } = req.body

  await assertOwnsCourse(courseId, req.user.id)

  await Course.findByIdAndUpdate(courseId, {
    $pull: {
      courseContent: sectionId,
    },
  })
  const section = await Section.findById(sectionId)
  if (!section) {
    throw new ApiError(404, "Section not found")
  }
  // Delete the associated subsections
  //_id -> refer to the subSectionID
  await SubSection.deleteMany({ _id: { $in: section.subSection } })

  await Section.findByIdAndDelete(sectionId)

  // find the updated course and return it
  const course = await Course.findById(courseId).populate({
    path: "courseContent",
    populate: {
      path: "subSection",
    },
  })

  res.status(200).json({
    success: true,
    message: "Section and its subsections deleted successfully",
    data: course,
  })
})
