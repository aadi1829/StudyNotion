const Joi = require("joi")
const { objectId } = require("./common")

exports.createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  description: Joi.string().allow(""),
})

exports.categoryPageDetailsSchema = Joi.object({
  categoryId: objectId.required(),
})
