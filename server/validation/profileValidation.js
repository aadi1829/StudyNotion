const Joi = require("joi")

// The frontend sends every field on every update, defaulting the ones
// it doesn't have to "", so "" has to stay a valid value for each.
exports.updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(2).allow(""),
  lastName: Joi.string().trim().min(2).allow(""),
  dateOfBirth: Joi.string().allow(""),
  about: Joi.string().allow(""),
  contactNumber: Joi.string()
    .pattern(/^\d{10}$/)
    .allow("")
    .messages({ "string.pattern.base": "Contact number must be a 10-digit number" }),
  gender: Joi.string().allow(""),
})
