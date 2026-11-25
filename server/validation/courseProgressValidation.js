const Joi = require("joi")
const { objectId } = require("./common")

exports.updateCourseProgressSchema = Joi.object({
  courseId: objectId.required(),
  subsectionId: objectId.required(),
})
