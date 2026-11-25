const Joi = require("joi")
const { objectId } = require("./common")

exports.createSubSectionSchema = Joi.object({
  sectionId: objectId.required(),
  title: Joi.string().trim().min(2).required(),
  description: Joi.string().trim().min(2).required(),
})

exports.updateSubSectionSchema = Joi.object({
  sectionId: objectId.required(),
  subSectionId: objectId.required(),
  title: Joi.string().trim().min(2),
  description: Joi.string().trim().min(2),
})

exports.deleteSubSectionSchema = Joi.object({
  sectionId: objectId.required(),
  subSectionId: objectId.required(),
})
