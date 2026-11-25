const ApiError = require("../utils/ApiError")

// Validates req[source] (the request body by default) against a Joi
// schema before the controller runs, so every route gets the same
// error shape for bad input instead of each controller writing its
// own if-checks.
const validate = (schema, source = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  })

  if (error) {
    const details = error.details.map((detail) => detail.message)
    return next(new ApiError(400, "Validation failed", details))
  }

  req[source] = value
  next()
}

module.exports = validate
