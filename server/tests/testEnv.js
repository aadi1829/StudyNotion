// Required by every test file before `../app` is required, since app.js
// fails fast at require-time if any of these env vars are missing. The
// values themselves don't matter (nothing here calls out to a real
// Cloudinary/Mail/Razorpay service - see the utils/__mocks__ for those),
// except JWT_SECRET and RAZORPAY_SECRET, which tests use directly to sign
// tokens and payment signatures the same way the app itself would.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret"
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000"
process.env.CLOUD_NAME = process.env.CLOUD_NAME || "test-cloud"
process.env.API_KEY = process.env.API_KEY || "test-api-key"
process.env.API_SECRET = process.env.API_SECRET || "test-api-secret"
process.env.FOLDER_NAME = process.env.FOLDER_NAME || "test-folder"
process.env.MAIL_HOST = process.env.MAIL_HOST || "smtp.test.invalid"
process.env.MAIL_USER = process.env.MAIL_USER || "test@test.invalid"
process.env.MAIL_PASS = process.env.MAIL_PASS || "test-pass"
process.env.RAZORPAY_KEY = process.env.RAZORPAY_KEY || "rzp_test_key"
process.env.RAZORPAY_SECRET = process.env.RAZORPAY_SECRET || "rzp_test_secret"
// Only has to be a non-empty string - app.js checks for its presence but
// never reads its value (the real connection is made by each test's own
// mongodb-memory-server instance via mongoose.connect()).
process.env.MONGODB_URL = process.env.MONGODB_URL || "mongodb://unused/placeholder"
