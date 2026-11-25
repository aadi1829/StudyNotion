const { contactUsEmail } = require("../mail/templates/contactFormRes")
const mailSender = require("../utils/mailSender")
const catchAsync = require("../utils/catchAsync")
const ApiError = require("../utils/ApiError")

// Extracts form data from req.body.
// Generates an email body using a template (contactUsEmail()).
// Uses mailSender() utility to send the email.
// Sends a JSON response indicating success or error.

exports.contactUsController = catchAsync(async (req, res) => {
  const { email, firstname, lastname, message, phoneNo, countrycode } = req.body

  if (!email || !firstname || !lastname || !message) {
    throw new ApiError(400, "Please fill in all the required fields.")
  }

  const emailRes = await mailSender(
    email,
    "Your message has been received!",
    contactUsEmail(email, firstname, lastname, message, phoneNo, countrycode)
  )

  console.log("Email sent:", emailRes?.response)

  return res.status(200).json({
    success: true,
    message: "We have received your message. Thank you!",
  })
})
