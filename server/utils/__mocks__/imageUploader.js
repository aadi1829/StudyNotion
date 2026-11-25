// Manual mock - activated with jest.mock("../utils/imageUploader") in test
// files. Keeps tests from making real Cloudinary uploads.
module.exports = {
  uploadImageToCloudinary: jest.fn().mockResolvedValue({
    secure_url: "https://res.cloudinary.com/test/fake-upload.png",
    duration: 42,
  }),
}
