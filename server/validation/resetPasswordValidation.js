const Joi = require("joi")
const { passwordPattern } = require("./common")

exports.resetPasswordTokenSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
})

exports.resetPasswordSchema = Joi.object({
  password: Joi.string().min(8).pattern(passwordPattern).required().messages({
    "string.pattern.base": "Password must contain at least one letter and one number",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Password and Confirm Password do not match",
  }),
  token: Joi.string().required(),
})
