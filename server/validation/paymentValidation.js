const Joi = require("joi")
const { objectId } = require("./common")

const courseIdList = Joi.array().items(objectId).min(1).required()

exports.capturePaymentSchema = Joi.object({
  courses: courseIdList,
})

exports.verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  courses: courseIdList,
})

exports.sendPaymentSuccessEmailSchema = Joi.object({
  orderId: Joi.string().required(),
  paymentId: Joi.string().required(),
  amount: Joi.number().positive().required(),
})
