const Joi = require("joi")
const { objectId } = require("./common")

// tag/instructions arrive as a stringified JSON array (this is a
// multipart form, so every field is a string) - the controller parses
// and checks the array itself, this just makes sure the string is there.
exports.createCourseSchema = Joi.object({
  courseName: Joi.string().trim().min(2).required(),
  courseDescription: Joi.string().trim().min(10).required(),
  whatYouWillLearn: Joi.string().trim().required(),
  price: Joi.number().positive().required(),
  category: objectId.required(),
  status: Joi.string().valid("Draft", "Published"),
  tag: Joi.string().required(),
  instructions: Joi.string().required(),
})

exports.editCourseSchema = Joi.object({
  courseId: objectId.required(),
  courseName: Joi.string().trim().min(2),
  courseDescription: Joi.string().trim().min(10),
  whatYouWillLearn: Joi.string().trim(),
  price: Joi.number().positive(),
  category: objectId,
  status: Joi.string().valid("Draft", "Published"),
  tag: Joi.string(),
  instructions: Joi.string(),
})
