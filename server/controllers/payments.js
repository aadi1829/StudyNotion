const { instance } = require("../config/razorpay")
const Course = require("../models/Course")
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

      if (course.studentsEnroled.includes(uid)) {
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
    receipt: Math.random(Date.now()).toString(),
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
const crypto = require("crypto");

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

     // Enroll student in courses if valid
    await enrollStudents(courses, userId, res);

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

// enroll the student in the courses
const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please Provide Course ID and User ID" })
  }

  for (const courseId of courses) {
    try {
      // Find the course and enroll the student in it
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnroled: userId } },
        { new: true }
      )

      if (!enrolledCourse) {
        return res
          .status(500)
          .json({ success: false, error: "Course not found" })
      }
      console.log("Updated course: ", enrolledCourse)

      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      })
      // Find the student and add the course to their list of enrolled courses
      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      )

      console.log("Enrolled student: ", enrolledStudent)
      // Send an email notification to the enrolled student
      const emailResponse = await mailSender(
        enrolledStudent.email,
        `Successfully Enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
        )
      )

      console.log("Email sent successfully: ", emailResponse.response)
    } catch (error) {
      console.log(error)
      return res.status(500).json({ success: false, error: error.message })
    }
  }
}