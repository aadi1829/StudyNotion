const ApiError = require("../utils/ApiError")

// Catches any request that didn't match a route above it, so unknown
// URLs get a clean 404 instead of Express's default HTML error page.
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`))
}

module.exports = notFound
