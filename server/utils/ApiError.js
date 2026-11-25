// A lightweight error type that carries an HTTP status code, so
// catchAsync and the central error handler can respond with the
// right status instead of always falling back to 500.
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message)
    this.statusCode = statusCode
    this.details = details
  }
}

module.exports = ApiError
