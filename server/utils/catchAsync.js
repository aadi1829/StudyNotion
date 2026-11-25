// Wraps an async controller so a rejected promise reaches Express's
// error handler via next(error), instead of every controller needing
// its own try/catch.
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = catchAsync
