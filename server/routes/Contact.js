const express = require("express")
const router = express.Router()
const { contactUsController } = require("../controllers/ContactUs")
const validate = require("../middleware/validate")
const { contactUsSchema } = require("../validation/contactValidation")

router.post("/contact", validate(contactUsSchema), contactUsController)

module.exports = router
