// Manual mock - activated with jest.mock("../utils/mailSender") in test
// files. Keeps tests from making real SMTP calls (and from being slow or
// flaky because of them).
module.exports = jest.fn().mockResolvedValue({ response: "mocked-email-response" })
