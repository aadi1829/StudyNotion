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

// Capture the payment and initiate the Razorpay order
// Takes a list of selected courses from the user.
// Calculates the total price.
// Checks if the user already owns the courses.
// Generates a Razorpay order.
// Sends order details to the frontend to complete the payment.
exports.capturePayment = async (req, res) => {
  const { courses } = req.body
  const userId = req.user.id

  if (!Array.isArray(courses) || courses.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide a list of Course IDs",
    });
  }

  let total_amount = 0
  const uid = new mongoose.Types.ObjectId(userId)
  for (const course_id of courses) {
    let course
    try {
      course = await Course.findById(course_id)

      if (!course) {
        return res.status(404).json({
          success: false,
          message: `Course not found: ID ${course_id}`,
        });
      }

      const isAlreadyEnrolled = course.studentsEnroled.some(
        (enrolledStudentId) => enrolledStudentId.equals(uid)
      )

      if (isAlreadyEnrolled) {
        return res.status(400).json({
          success: false,
          message: `User already enrolled in: ${course.title}`,
        });
      }
    
      total_amount += course.price
    } catch (error) {
      console.error("Error finding course:", error);
      return res.status(500).json({
        success: false,
        message: "Internal error while processing courses",
      });
    }
  }

  const options = {
    amount: total_amount * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  }

  try {
    // Initiate the payment using Razorpay
    console.log("Creating order with amount ₹", total_amount);
    const paymentResponse = await instance.orders.create(options)
    console.log(paymentResponse)
    res.status(200).json({
      success: true,
      data: paymentResponse,
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).json({
      success: false,
      message: "Could not initiate payment order",
    });
  }
}

// verify the payment
exports.verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    courses
  } = req.body;

  const userId = req.user?.id;

  //  Validate required fields
  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !Array.isArray(courses) ||
    courses.length === 0 ||
    !userId
  ) {
   return res.status(400).json({ success: false, message: "Missing payment details" });
 }

    try {
    // Generate expected signature using HMAC with SHA256
     const body = `${razorpay_order_id}|${razorpay_payment_id}`;
     const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(401).json({ success: false, message: "Payment verification failed!" });
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
      });
    }

     // Enroll student in courses if valid
    const enrollResult = await enrollStudents(courses, userId, res);
    if (!enrollResult.success) {
      // enrollStudents has already sent an error response, so stop here
      return
    }

    // Keep a record of this payment so the same payment can never be
    // used to enroll the student a second time
    await Payment.create({
      user: userId,
      courses,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: enrollResult.totalAmount,
    })

    return res.status(200).json({
      success: true,
      message: "Payment verified and student enrolled."
    });

  } catch (error) {
     console.error("Payment verification error:", error);
      return res.status(500).json({
      success: false,
      message: "Internal server error during payment verification.",
    });
   }
};


// Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body

  const userId = req.user.id

  if (!orderId || !paymentId || !amount || !userId) {
    return res.status(400).json({
      success: false,
      message: "Missing required payment or user information.",
    });
  }

  try {
    const enrolledStudent = await User.findById(userId)

    if (!enrolledStudent) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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
    );

    return res.status(200).json({
      success: true,
      message: "Payment email sent successfully",
    });
  } catch (error) {
    console.error("Error sending payment email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send payment email",
    });
  }
}

// Enroll the student in the courses.
// On success, returns { success: true, totalAmount }.
// On failure, it sends the error response itself and returns { success: false } -
// the caller should check this and stop instead of also sending a response.
const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    res
      .status(400)
      .json({ success: false, message: "Please Provide Course ID and User ID" })
    return { success: false }
  }

  let totalAmount = 0

  for (const courseId of courses) {
    try {
      // Add the student to the course only if they are not already in
      // there, so calling this twice for the same course never adds
      // them a second time
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $addToSet: { studentsEnroled: userId } },
        { new: true }
      )

      if (!enrolledCourse) {
        res.status(500).json({ success: false, error: "Course not found" })
        return { success: false }
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
    } catch (error) {
      console.log(error)
      res.status(500).json({ success: false, error: error.message })
      return { success: false }
    }
  }

  return { success: true, totalAmount }
}