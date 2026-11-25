require("./testEnv")
jest.mock("../utils/mailSender")
jest.mock("../utils/imageUploader")

const request = require("supertest")
const app = require("../app")
const Category = require("../models/Category")
const { startDb, stopDb, clearDb, createUser, tokenFor } = require("./helpers")

beforeAll(startDb)
afterAll(stopDb)
afterEach(clearDb)

// Builds a fresh course (with one section and one subsection) owned by
// instructorA, plus a second instructor who owns nothing. This is the
// fixture for the IDOR regression test: instructorB must never be able to
// touch instructorA's course content.
async function buildFixture() {
  const instructorA = await createUser({ accountType: "Instructor", email: "ownerA@example.com" })
  const instructorB = await createUser({ accountType: "Instructor", email: "ownerB@example.com" })
  const tokenA = tokenFor(instructorA)
  const tokenB = tokenFor(instructorB)

  const category = await Category.create({ name: "IDOR Test Category" })

  const courseRes = await request(app)
    .post("/api/v1/course/createCourse")
    .set("Authorization", `Bearer ${tokenA}`)
    .field("courseName", "Ownership Test Course")
    .field("courseDescription", "A course used to test section ownership.")
    .field("whatYouWillLearn", "Nothing real, this is a fixture")
    .field("price", "100")
    .field("category", category._id.toString())
    .field("status", "Published")
    .field("tag", JSON.stringify(["test"]))
    .field("instructions", JSON.stringify(["step 1"]))
    .attach("thumbnailImage", Buffer.from("fake-image-bytes"), "thumb.png")

  const courseId = courseRes.body.data._id

  const sectionRes = await request(app)
    .post("/api/v1/course/addSection")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ sectionName: "Section 1", courseId })

  const sectionId = sectionRes.body.updatedCourse.courseContent.slice(-1)[0]._id

  const subSectionRes = await request(app)
    .post("/api/v1/course/addSubSection")
    .set("Authorization", `Bearer ${tokenA}`)
    .field("sectionId", sectionId)
    .field("title", "Lecture 1")
    .field("description", "A test lecture")
    .attach("video", Buffer.from("fake-video-bytes"), "video.mp4")

  const subSectionId = subSectionRes.body.data.subSection.slice(-1)[0]._id

  return { tokenA, tokenB, courseId, sectionId, subSectionId }
}

describe("Course/section/subsection ownership (IDOR regression)", () => {
  it("lets the owning instructor build course content", async () => {
    const { sectionId, subSectionId, courseId } = await buildFixture()
    expect(courseId).toBeTruthy()
    expect(sectionId).toBeTruthy()
    expect(subSectionId).toBeTruthy()
  })

  it("blocks a non-owning instructor from updateSection", async () => {
    const { tokenB, sectionId, courseId } = await buildFixture()
    const res = await request(app)
      .post("/api/v1/course/updateSection")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ sectionId, courseId, sectionName: "Hijacked" })
    expect(res.status).toBe(403)
  })

  it("blocks a non-owning instructor from deleteSection", async () => {
    const { tokenB, sectionId, courseId } = await buildFixture()
    const res = await request(app)
      .post("/api/v1/course/deleteSection")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ sectionId, courseId })
    expect(res.status).toBe(403)
  })

  it("blocks a non-owning instructor from addSubSection", async () => {
    const { tokenB, sectionId } = await buildFixture()
    const res = await request(app)
      .post("/api/v1/course/addSubSection")
      .set("Authorization", `Bearer ${tokenB}`)
      .field("sectionId", sectionId)
      .field("title", "Hijacked")
      .field("description", "Hijack attempt")
      .attach("video", Buffer.from("fake-video-bytes"), "video.mp4")
    expect(res.status).toBe(403)
  })

  it("blocks a non-owning instructor from updateSubSection", async () => {
    const { tokenB, sectionId, subSectionId } = await buildFixture()
    const res = await request(app)
      .post("/api/v1/course/updateSubSection")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ sectionId, subSectionId, title: "Hijacked" })
    expect(res.status).toBe(403)
  })

  it("blocks a non-owning instructor from deleteSubSection", async () => {
    const { tokenB, sectionId, subSectionId } = await buildFixture()
    const res = await request(app)
      .post("/api/v1/course/deleteSubSection")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ sectionId, subSectionId })
    expect(res.status).toBe(403)
  })

  it("still lets the real owner update their own section", async () => {
    const { tokenA, sectionId, courseId } = await buildFixture()
    const res = await request(app)
      .post("/api/v1/course/updateSection")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ sectionId, courseId, sectionName: "Renamed by owner" })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("still lets the real owner delete their own section", async () => {
    const { tokenA, sectionId, courseId } = await buildFixture()
    const res = await request(app)
      .post("/api/v1/course/deleteSection")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ sectionId, courseId })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
