require("./testEnv")
jest.mock("../utils/mailSender")

const request = require("supertest")
const app = require("../app")
const User = require("../models/User")
const { startDb, stopDb, clearDb, createUser, tokenFor, seedOtp } = require("./helpers")

beforeAll(startDb)
afterAll(stopDb)
afterEach(clearDb)

describe("POST /api/v1/auth/signup", () => {
  it("rejects mismatched password/confirmPassword", async () => {
    await seedOtp("mismatch@example.com", "123456")
    const res = await request(app).post("/api/v1/auth/signup").send({
      firstName: "Ann",
      lastName: "Bee",
      email: "mismatch@example.com",
      password: "Password123",
      confirmPassword: "DifferentPass123",
      accountType: "Student",
      otp: "123456",
    })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.details.join(" ")).toMatch(/password and confirm password/i)
  })

  it("rejects a bad OTP", async () => {
    await seedOtp("badotp@example.com", "123456")
    const res = await request(app).post("/api/v1/auth/signup").send({
      firstName: "Ann",
      lastName: "Bee",
      email: "badotp@example.com",
      password: "Password123",
      confirmPassword: "Password123",
      accountType: "Student",
      otp: "000000",
    })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/otp is not valid/i)

    const user = await User.findOne({ email: "badotp@example.com" })
    expect(user).toBeNull()
  })

  it("rejects accountType: Admin (privilege escalation)", async () => {
    await seedOtp("escalate@example.com", "123456")
    const res = await request(app).post("/api/v1/auth/signup").send({
      firstName: "Evil",
      lastName: "User",
      email: "escalate@example.com",
      password: "Password123",
      confirmPassword: "Password123",
      accountType: "Admin",
      otp: "123456",
    })

    expect(res.status).toBe(400)
    expect(res.body.details.join(" ")).toMatch(/accountType/)

    const user = await User.findOne({ email: "escalate@example.com" })
    expect(user).toBeNull()
  })

  it("creates the user on valid signup data + matching OTP", async () => {
    await seedOtp("newstudent@example.com", "123456")
    const res = await request(app).post("/api/v1/auth/signup").send({
      firstName: "New",
      lastName: "Student",
      email: "newstudent@example.com",
      password: "Password123",
      confirmPassword: "Password123",
      accountType: "Student",
      otp: "123456",
    })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.user.accountType).toBe("Student")

    const user = await User.findOne({ email: "newstudent@example.com" })
    expect(user).not.toBeNull()
  })
})

describe("POST /api/v1/auth/login", () => {
  it("logs in with correct credentials", async () => {
    await createUser({ accountType: "Student", email: "login@example.com", password: "Password123" })

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "login@example.com", password: "Password123" })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeTruthy()
  })

  it("rejects an incorrect password", async () => {
    await createUser({ accountType: "Student", email: "wrongpass@example.com", password: "Password123" })

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "wrongpass@example.com", password: "SomethingElse123" })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it("rejects an email that was never registered", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "doesnotexist@example.com", password: "Password123" })

    expect(res.status).toBe(401)
  })
})

describe("POST /api/v1/auth/changepassword", () => {
  it("rejects the wrong old password", async () => {
    const user = await createUser({
      accountType: "Student",
      email: "changepw1@example.com",
      password: "Password123",
    })
    const token = tokenFor(user)

    const res = await request(app)
      .post("/api/v1/auth/changepassword")
      .set("Authorization", `Bearer ${token}`)
      .send({ oldPassword: "WrongOldPassword1", newPassword: "NewPassword456" })

    expect(res.status).toBe(401)
  })

  it("changes the password and invalidates the old token", async () => {
    const user = await createUser({
      accountType: "Student",
      email: "changepw2@example.com",
      password: "Password123",
    })
    const oldToken = tokenFor(user)

    // The invalidation check compares JWT "iat" (second resolution) against
    // passwordChangedAt, so give them a clear second apart - otherwise this
    // could flake if both land in the same second.
    await new Promise((resolve) => setTimeout(resolve, 1100))

    const changeRes = await request(app)
      .post("/api/v1/auth/changepassword")
      .set("Authorization", `Bearer ${oldToken}`)
      .send({ oldPassword: "Password123", newPassword: "NewPassword456" })

    expect(changeRes.status).toBe(200)
    expect(changeRes.body.success).toBe(true)
    const newToken = changeRes.body.token
    expect(newToken).toBeTruthy()

    // The old token was issued before passwordChangedAt, so it must now
    // be rejected even though its JWT signature is still technically valid.
    const oldTokenRes = await request(app)
      .get("/api/v1/profile/getUserDetails")
      .set("Authorization", `Bearer ${oldToken}`)
    expect(oldTokenRes.status).toBe(401)

    // The freshly issued token should work.
    const newTokenRes = await request(app)
      .get("/api/v1/profile/getUserDetails")
      .set("Authorization", `Bearer ${newToken}`)
    expect(newTokenRes.status).toBe(200)

    // And login now requires the new password, not the old one.
    const loginWithOld = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "changepw2@example.com", password: "Password123" })
    expect(loginWithOld.status).toBe(401)

    const loginWithNew = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "changepw2@example.com", password: "NewPassword456" })
    expect(loginWithNew.status).toBe(200)
  })
})
