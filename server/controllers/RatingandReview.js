const RatingAndReview = require("../models/RatingandReview")
const Course = require("../models/Course")
const mongoose = require("mongoose")
const catchAsync = require("../utils/catchAsync")
const ApiError = require("../utils/ApiError")

// Create a new rating and review
exports.createRating = catchAsync(async (req, res) => {
  const userId = req.user.id
  const { rating, review, courseId } = req.body

  const courseDetails = await Course.findOne({
    _id: courseId,
    studentsEnroled: { $elemMatch: { $eq: userId } },
  })

  if (!courseDetails) {
    throw new ApiError(404, "You must be enrolled in the course to leave a review")
  }

  const alreadyReviewed = await RatingAndReview.findOne({
    user: userId,
    course: courseId,
  })

  if (alreadyReviewed) {
    throw new ApiError(403, "You have already reviewed this course")
  }

  const ratingReview = await RatingAndReview.create({
    rating,
    review,
    course: courseId,
    user: userId,
  })

  // Add the rating and review to the course
  await Course.findByIdAndUpdate(courseId, {
    $push: {
      ratingAndReviews: ratingReview._id,
    },
  })

  return res.status(201).json({
    success: true,
    message: "Rating and review created successfully",
    ratingReview,
  })
})

// Get the average rating for a course
exports.getAverageRating = catchAsync(async (req, res) => {
  const courseId = req.body.courseId || req.query.courseId

  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, "A valid courseId is required")
  }

  // Calculate the average rating using the MongoDB aggregation pipeline
  const result = await RatingAndReview.aggregate([
    {
      $match: {
        course: new mongoose.Types.ObjectId(courseId), // Convert courseId to ObjectId
      },
    },
    {
      $group: {
        _id: null, //kisi specific field ke basis pr group nhi bnana hai, saare doc ko ek hi group mai put krdo
        averageRating: { $avg: "$rating" },
      },
    },
  ])

  const averageRating = result.length > 0 ? result[0].averageRating : 0

  return res.status(200).json({
    success: true,
    averageRating,
  })
})

// Get all rating and reviews
exports.getAllRatingReview = catchAsync(async (req, res) => {
  const allReviews = await RatingAndReview.find({})
    .sort({ rating: "desc" })
    .populate({
      path: "user",
      select: "firstName lastName email image", // Specify the fields you want to populate from the "Profile" model
    })
    .populate({
      path: "course",
      select: "courseName", //Specify the fields you want to populate from the "Course" model
    })
    .exec()

  res.status(200).json({
    success: true,
    data: allReviews,
  })
})
