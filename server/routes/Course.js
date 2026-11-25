const express = require("express")
const router = express.Router()

// Course Controllers Import
const { createCourse,getAllCourses,getCourseDetails,getFullCourseDetails,editCourse,getInstructorCourses,deleteCourse} = require("../controllers/Course")

// Categories Controllers Import
const {showAllCategories,createCategory,categoryPageDetails} = require("../controllers/Category")

// Sections Controllers Import
const {createSection,updateSection,deleteSection} = require("../controllers/Section")

// Sub-Sections Controllers Import
const {createSubSection,updateSubSection,deleteSubSection} = require("../controllers/Subsection")

// Rating Controllers Import
const {createRating,getAverageRating,getAllRatingReview} = require("../controllers/RatingandReview")

//course Progress Controller
const {updateCourseProgress,getProgressPercentage} = require("../controllers/courseProgress")
// Importing Middlewares
const { auth, isInstructor, isStudent, isAdmin } = require("../middleware/auth")
const validate = require("../middleware/validate")

const { createCourseSchema, editCourseSchema } = require("../validation/courseValidation")
const { createCategorySchema, categoryPageDetailsSchema } = require("../validation/categoryValidation")
const {
  createSectionSchema,
  updateSectionSchema,
  deleteSectionSchema,
} = require("../validation/sectionValidation")
const {
  createSubSectionSchema,
  updateSubSectionSchema,
  deleteSubSectionSchema,
} = require("../validation/subsectionValidation")
const { createRatingSchema } = require("../validation/ratingValidation")
const { updateCourseProgressSchema } = require("../validation/courseProgressValidation")


// Courses can Only be Created by Instructors
router.post("/createCourse", auth, isInstructor, validate(createCourseSchema), createCourse)
// Edit Course routes
router.post("/editCourse", auth, isInstructor, validate(editCourseSchema), editCourse)
//Add a Section to a Course
router.post("/addSection", auth, isInstructor, validate(createSectionSchema), createSection)
// Update a Section
router.post("/updateSection", auth, isInstructor, validate(updateSectionSchema), updateSection)
// Delete a Section
router.post("/deleteSection", auth, isInstructor, validate(deleteSectionSchema), deleteSection)
// Edit Sub Section
router.post(
  "/updateSubSection",
  auth,
  isInstructor,
  validate(updateSubSectionSchema),
  updateSubSection
)
// Delete Sub Section
router.post(
  "/deleteSubSection",
  auth,
  isInstructor,
  validate(deleteSubSectionSchema),
  deleteSubSection
)
// Add a Sub Section to a Section
router.post(
  "/addSubSection",
  auth,
  isInstructor,
  validate(createSubSectionSchema),
  createSubSection
)
// Get all Courses Under a Specific Instructor
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses)
// Get all Registered Courses
router.get("/getAllCourses", getAllCourses)
// Get Details for a Specific Courses
router.post("/getCourseDetails", getCourseDetails)
// Get Details for a Specific Courses
router.post("/getFullCourseDetails", auth, getFullCourseDetails)
// To Update Course Progress
router.post(
  "/updateCourseProgress",
  auth,
  isStudent,
  validate(updateCourseProgressSchema),
  updateCourseProgress
)
// To get Course Progress
// router.post("/getProgressPercentage", auth, isStudent, getProgressPercentage)
// Delete a Course
router.delete("/deleteCourse", auth, isInstructor, deleteCourse)

// Category can Only be Created by Admin
router.post("/createCategory", auth, isAdmin, validate(createCategorySchema), createCategory)
router.get("/showAllCategories", showAllCategories)
router.post("/getCategoryPageDetails", validate(categoryPageDetailsSchema), categoryPageDetails)

router.post("/createRating", auth, isStudent, validate(createRatingSchema), createRating)
router.get("/getAverageRating", getAverageRating)
router.get("/getReviews", getAllRatingReview)

module.exports = router
