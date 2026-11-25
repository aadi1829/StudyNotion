const Joi = require("joi")
const { passwordPattern } = require("./common")

exports.signupSchema = Joi.object({
  firstName: Joi.string().trim().min(2).required(),
  lastName: Joi.string().trim().min(2).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).pattern(passwordPattern).required().messages({
    "string.pattern.base": "Password must contain at least one letter and one number",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Password and Confirm Password do not match",
  }),
  // "Admin" is deliberately left out - nobody should be able to make
  // themselves an admin through the public signup form.
  accountType: Joi.string().valid("Student", "Instructor").required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
})

exports.loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
})

exports.sendOtpSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
})

exports.changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(passwordPattern)
    .invalid(Joi.ref("oldPassword"))
    .required()
    .messages({
      "string.pattern.base": "Password must contain at least one letter and one number",
      "any.invalid": "New password must be different from the old password",
    }),
})
