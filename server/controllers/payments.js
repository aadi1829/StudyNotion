const { instance } = require("../config/razorpay")
const Course = require("../models/Course")
const Payment = require("../models/Payment")
const crypto = require("crypto")
const User = require("../models/User")
const mailSender = require("../utils/mailSender")
const mongoose = require("mongoose")
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail")
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail")
const CourseProgress = require("../models/CourseProgress")
const catchAsync = require("../utils/catchAsync")
const ApiError = require("../utils/ApiError")

// Capture the payment and initiate the Razorpay order
// Takes a list of selected courses from the user.
// Calculates the total price.
// Checks if the user already owns the courses.
// Generates a Razorpay order.
// Sends order details to the frontend to complete the payment.
exports.capturePayment = catchAsync(async (req, res) => {
  const { courses } = req.body
  const userId = req.user.id

  let total_amount = 0
  const uid = new mongoose.Types.ObjectId(userId)
  for (const course_id of courses) {
    const course = await Course.findById(course_id)

    if (!course) {
      throw new ApiError(404, `Course not found: ID ${course_id}`)
    }

    const isAlreadyEnrolled = course.studentsEnroled.some((enrolledStudentId) =>
      enrolledStudentId.equals(uid)
    )

    if (isAlreadyEnrolled) {
      throw new ApiError(400, `User already enrolled in: ${course.courseName}`)
    }

    total_amount += course.price
  }

  const options = {
    amount: total_amount * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  }

  const paymentResponse = await instance.orders.create(options)
  res.status(200).json({
    success: true,
    data: paymentResponse,
  })
})

// verify the payment
exports.verifyPayment = catchAsync(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courses } = req.body

  const userId = req.user.id

  // Generate expected signature using HMAC with SHA256
  const body = `${razorpay_order_id}|${razorpay_payment_id}`
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body)
    .digest("hex")

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(401, "Payment verification failed!")
  }

  // If we already have a record of this exact payment, we already
  // enrolled the student for it earlier. Don't do it again.
  const existingPayment = await Payment.findOne({
    razorpayPaymentId: razorpay_payment_id,
  })

  if (existingPayment) {
    return res.status(200).json({
      success: true,
      message: "Payment was already verified and the student is enrolled.",
    })
  }

  // Enroll student in courses if valid
  const { totalAmount } = await enrollStudents(courses, userId)

  // Keep a record of this payment so the same payment can never be
  // used to enroll the student a second time
  await Payment.create({
    user: userId,
    courses,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    amount: totalAmount,
  })

  return res.status(200).json({
    success: true,
    message: "Payment verified and student enrolled.",
  })
})

// Send Payment Success Email
exports.sendPaymentSuccessEmail = catchAsync(async (req, res) => {
  const { orderId, paymentId, amount } = req.body
  const userId = req.user.id

  const enrolledStudent = await User.findById(userId)

  if (!enrolledStudent) {
    throw new ApiError(404, "User not found")
  }

  await mailSender(
    enrolledStudent.email,
    `Payment Received`,
    paymentSuccessEmail(
      `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
      amount / 100,
      orderId,
      paymentId
    )
  )

  return res.status(200).json({
    success: true,
    message: "Payment email sent successfully",
  })
})

// Enroll the student in the courses, returning the total amount of the
// courses enrolled in. Throws ApiError on failure instead of writing
// to res itself, so the caller (verifyPayment) stays in control of the
// response and nothing gets enrolled only to then return an error.
const enrollStudents = async (courses, userId) => {
  let totalAmount = 0

  for (const courseId of courses) {
    // Add the student to the course only if they are not already in
    // there, so calling this twice for the same course never adds
    // them a second time
    const enrolledCourse = await Course.findOneAndUpdate(
      { _id: courseId },
      { $addToSet: { studentsEnroled: userId } },
      { new: true }
    )

    if (!enrolledCourse) {
      throw new ApiError(404, `Course not found: ID ${courseId}`)
    }

    totalAmount += enrolledCourse.price

    // Only create a progress record the first time around, so a
    // repeated call does not create duplicate progress documents
    let courseProgress = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    })

    if (!courseProgress) {
      courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      })
    }

    // Find the student and add the course to their list of enrolled courses
    const enrolledStudent = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          courses: courseId,
          courseProgress: courseProgress._id,
        },
      },
      { new: true }
    )

    // Send an email notification to the enrolled student
    await mailSender(
      enrolledStudent.email,
      `Successfully Enrolled into ${enrolledCourse.courseName}`,
      courseEnrollmentEmail(
        enrolledCourse.courseName,
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
      )
    )
  }

  return { totalAmount }
}
