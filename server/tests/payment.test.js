require("./testEnv")
jest.mock("../utils/mailSender")

const crypto = require("crypto")
const request = require("supertest")
const app = require("../app")
const Course = require("../models/Course")
const Payment = require("../models/Payment")
const { startDb, stopDb, clearDb, createUser, tokenFor } = require("./helpers")

beforeAll(startDb)
afterAll(stopDb)
afterEach(clearDb)

function signaturesFor(orderId, paymentId) {
  return crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")
}

async function buildFixture() {
  const instructor = await createUser({ accountType: "Instructor", email: "payinstructor@example.com" })
  const student = await createUser({ accountType: "Student", email: "paystudent@example.com" })
  const course = await Course.create({
    courseName: "Payment Test Course",
    courseDescription: "A course used to test payment verification.",
    instructor: instructor._id,
    whatYouWillLearn: "Idempotency",
    price: 500,
    tag: ["test"],
    category: new (require("mongoose").Types.ObjectId)(),
    thumbnail: "https://example.com/fake.png",
    status: "Published",
    instructions: ["step 1"],
  })
  return { student, course }
}

describe("POST /api/v1/payment/verifyPayment", () => {
  it("rejects a forged signature", async () => {
    const { student, course } = await buildFixture()
    const token = tokenFor(student)

    const res = await request(app)
      .post("/api/v1/payment/verifyPayment")
      .set("Authorization", `Bearer ${token}`)
      .send({
        razorpay_order_id: "order_forged",
        razorpay_payment_id: "pay_forged",
        razorpay_signature: "0".repeat(64),
        courses: [course._id.toString()],
      })

    expect(res.status).toBe(401)

    const updatedCourse = await Course.findById(course._id)
    expect(updatedCourse.studentsEnroled).toHaveLength(0)
  })

  it("enrolls the student on a valid signature", async () => {
    const { student, course } = await buildFixture()
    const token = tokenFor(student)
    const orderId = "order_valid_1"
    const paymentId = "pay_valid_1"

    const res = await request(app)
      .post("/api/v1/payment/verifyPayment")
      .set("Authorization", `Bearer ${token}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signaturesFor(orderId, paymentId),
        courses: [course._id.toString()],
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    const updatedCourse = await Course.findById(course._id)
    expect(updatedCourse.studentsEnroled.map(String)).toEqual([student._id.toString()])

    const payments = await Payment.find({ razorpayPaymentId: paymentId })
    expect(payments).toHaveLength(1)
  })

  it("is idempotent: calling verifyPayment twice with the same payment id enrolls exactly once", async () => {
    const { student, course } = await buildFixture()
    const token = tokenFor(student)
    const orderId = "order_valid_2"
    const paymentId = "pay_valid_2"
    const signature = signaturesFor(orderId, paymentId)
    const body = {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      courses: [course._id.toString()],
    }

    const firstRes = await request(app)
      .post("/api/v1/payment/verifyPayment")
      .set("Authorization", `Bearer ${token}`)
      .send(body)
    expect(firstRes.status).toBe(200)

    const secondRes = await request(app)
      .post("/api/v1/payment/verifyPayment")
      .set("Authorization", `Bearer ${token}`)
      .send(body)
    expect(secondRes.status).toBe(200)
    expect(secondRes.body.message).toMatch(/already verified/i)

    const updatedCourse = await Course.findById(course._id)
    expect(updatedCourse.studentsEnroled).toHaveLength(1)

    const payments = await Payment.find({ razorpayPaymentId: paymentId })
    expect(payments).toHaveLength(1)
  })

  it("rejects a non-student (isStudent gate)", async () => {
    const instructor = await createUser({ accountType: "Instructor", email: "notastudent@example.com" })
    const { course } = await buildFixture()
    const token = tokenFor(instructor)
    const orderId = "order_valid_3"
    const paymentId = "pay_valid_3"

    const res = await request(app)
      .post("/api/v1/payment/verifyPayment")
      .set("Authorization", `Bearer ${token}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signaturesFor(orderId, paymentId),
        courses: [course._id.toString()],
      })

    expect(res.status).toBe(401)
  })
})
