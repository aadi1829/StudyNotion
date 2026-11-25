const Joi = require("joi")
const { objectId } = require("./common")

exports.createSectionSchema = Joi.object({
  sectionName: Joi.string().trim().min(2).required(),
  courseId: objectId.required(),
})

exports.updateSectionSchema = Joi.object({
  sectionName: Joi.string().trim().min(2).required(),
  sectionId: objectId.required(),
  courseId: objectId.required(),
})

exports.deleteSectionSchema = Joi.object({
  sectionId: objectId.required(),
  courseId: objectId.required(),
})
