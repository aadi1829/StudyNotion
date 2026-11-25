const Joi = require("joi")
const { objectId } = require("./common")

exports.createRatingSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  review: Joi.string().trim().min(10).required(),
  courseId: objectId.required(),
})
