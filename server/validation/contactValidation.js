const Joi = require("joi")

exports.contactUsSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  firstname: Joi.string().trim().min(2).required(),
  lastname: Joi.string().trim().min(2).required(),
  message: Joi.string().trim().min(10).required(),
  phoneNo: Joi.string().allow(""),
  countrycode: Joi.string().allow(""),
})
