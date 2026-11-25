// Import the required modules
const express = require("express")
const router = express.Router()
const {
  capturePayment,
  verifyPayment,
  sendPaymentSuccessEmail,
} = require("../controllers/payments")
const { auth, isStudent } = require("../middleware/auth")
const validate = require("../middleware/validate")
const {
  capturePaymentSchema,
  verifyPaymentSchema,
  sendPaymentSuccessEmailSchema,
} = require("../validation/paymentValidation")

router.post("/capturePayment", auth, isStudent, validate(capturePaymentSchema), capturePayment)
router.post("/verifyPayment", auth, isStudent, validate(verifyPaymentSchema), verifyPayment)
router.post(
  "/sendPaymentSuccessEmail",
  auth,
  isStudent,
  validate(sendPaymentSuccessEmailSchema),
  sendPaymentSuccessEmail
)

module.exports = router
