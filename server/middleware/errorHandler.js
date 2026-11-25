// Turns any error passed to next() into one consistent JSON response,
// instead of every controller choosing its own status code and shape.
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500

  if (statusCode === 500) {
    console.error(err)
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    ...(err.details && { details: err.details }),
  })
}

module.exports = errorHandler
