const { contactUsEmail } = require("../mail/templates/contactFormRes")
const mailSender = require("../utils/mailSender")

// Extracts form data from req.body.
// Generates an email body using a template (contactUsEmail()).
// Uses mailSender() utility to send the email.
// Sends a JSON response indicating success or error.

exports.contactUsController = async (req, res) => {

  const { email, firstname, lastname, message, phoneNo, countrycode } = req.body
  
  if (!email || !firstname || !lastname || !message) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all the required fields.",
    });
  }

  try {
    const emailRes = await mailSender(
      email,
      "Your message has been received!",
      contactUsEmail(email, firstname, lastname, message, phoneNo, countrycode)
    )

    console.log("Email sent:", emailResponse.response);

    return res.status(200).json({
      success: true,
      message: "We have received your message. Thank you!",
    });
  } catch (error) {
    console.error("Error sending email:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending your message.",
    })
  }
}
