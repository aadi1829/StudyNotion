// Import necessary modules
const Section = require("../models/Section")
const SubSection = require("../models/Subsection")
const Course = require("../models/Course")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const catchAsync = require("../utils/catchAsync")
const ApiError = require("../utils/ApiError")

// These routes only receive a sectionId, not a courseId, so ownership
// has to be checked by finding which course that section belongs to.
// Same check as Section.js - any instructor could otherwise add, edit
// or delete subsections on a course that isn't theirs.
async function assertOwnsSection(sectionId, userId) {
  const course = await Course.findOne({ courseContent: sectionId })
  if (!course) {
    throw new ApiError(404, "Section does not belong to any course")
  }
  if (course.instructor.toString() !== userId) {
    throw new ApiError(403, "You are not allowed to modify this course")
  }
}

// Create a new sub-section for a given section
// Accepts input from the front-end to create a new subsection (lesson).
// Uploads a video to Cloudinary.
// Saves the video URL and metadata in a SubSection document.
// Links it to the relevant Section document.
// Returns the updated Section (with all its subsections)
exports.createSubSection = catchAsync(async (req, res) => {
  const { sectionId, title, description } = req.body
  const video = req.files?.video

  if (!video) {
    throw new ApiError(400, "A lecture video file is required")
  }

  await assertOwnsSection(sectionId, req.user.id)

  const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME)

  if (!uploadDetails || !uploadDetails.secure_url) {
    throw new ApiError(500, "Failed to upload video. Please try again.")
  }

  const SubSectionDetails = await SubSection.create({
    title: title,
    timeDuration: `${uploadDetails.duration}`,
    description: description,
    videoUrl: uploadDetails.secure_url,
  })

  // Update the corresponding section with the newly created sub-section
  const updatedSection = await Section.findByIdAndUpdate(
    { _id: sectionId },
    { $push: { subSection: SubSectionDetails._id } },
    { new: true }
  ).populate("subSection")

  // Return the updated section in the response
  return res.status(200).json({
    success: true,
    message: "SubSection created Successfully",
    data: updatedSection,
  })
})

exports.updateSubSection = catchAsync(async (req, res) => {
  const { sectionId, subSectionId, title, description } = req.body

  await assertOwnsSection(sectionId, req.user.id)

  const subSection = await SubSection.findById(subSectionId)

  if (!subSection) {
    throw new ApiError(404, "SubSection not found")
  }

  if (title !== undefined) {
    subSection.title = title
  }

  if (description !== undefined) {
    subSection.description = description
  }
  if (req.files && req.files.video !== undefined) {
    const video = req.files.video
    const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME)
    subSection.videoUrl = uploadDetails.secure_url
    subSection.timeDuration = `${uploadDetails.duration}`
  }

  await subSection.save()

  // find updated section and return it
  const updatedSection = await Section.findById(sectionId).populate("subSection")

  return res.status(200).json({
    success: true,
    message: "Section updated successfully",
    data: updatedSection,
  })
})

exports.deleteSubSection = catchAsync(async (req, res) => {
  const { subSectionId, sectionId } = req.body

  await assertOwnsSection(sectionId, req.user.id)

  await Section.findByIdAndUpdate(
    { _id: sectionId },
    {
      $pull: {
        subSection: subSectionId,
      },
    },
    { new: true }
  )
  const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

  if (!subSection) {
    throw new ApiError(404, "SubSection not found")
  }

  // find updated section and return it
  const updatedSection = await Section.findById(sectionId).populate("subSection")

  return res.status(200).json({
    success: true,
    message: "SubSection deleted successfully",
    data: updatedSection,
  })
})
