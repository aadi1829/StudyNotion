const Joi = require("joi")

// A Mongo ObjectId is a 24-character hex string. Reused anywhere a
// request references another document by its _id, so a malformed id
// fails validation with a clean 400 instead of reaching Mongoose and
// throwing an unhandled CastError.
exports.objectId = Joi.string().hex().length(24)

// At least one letter and one digit, so a password of just digits or
// just letters is rejected.
exports.passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).+$/
