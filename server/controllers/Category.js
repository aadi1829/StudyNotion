const Category = require("../models/Category")
const catchAsync = require("../utils/catchAsync")
const ApiError = require("../utils/ApiError")

function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}

exports.createCategory = catchAsync(async (req, res) => {
  const { name, description } = req.body

  const existingCategory = await Category.findOne({ name })
  if (existingCategory) {
    throw new ApiError(409, "Category already exist")
  }

  await Category.create({ name, description })

  return res.status(200).json({
    success: true,
    message: "Category Created Successfully",
  })
})

exports.showAllCategories = catchAsync(async (req, res) => {
  const allCategories = await Category.find()

  if (allCategories.length === 0) {
    throw new ApiError(404, "No categories found")
  }

  res.status(200).json({
    success: true,
    message: "All categories fetched successfully",
    data: allCategories,
  })
})

//All published courses in the selected category.
//The top 10 best-selling courses across all categories.
//Published courses in another (random) category.
exports.categoryPageDetails = catchAsync(async (req, res) => {
  const { categoryId } = req.body

  const selectedCategory = await Category.findById(categoryId)
    .populate({
      path: "courses",
      match: { status: "Published" },
      populate: "ratingAndReviews",
    })
    .exec()

  if (!selectedCategory) {
    throw new ApiError(404, "Category not found")
  }

  if (selectedCategory.courses.length === 0) {
    throw new ApiError(404, "No courses found for the selected category.")
  }

  // Get courses for other categories
  const categoriesExceptSelected = await Category.find({
    _id: { $ne: categoryId },
  })

  let differentCategory
  if (categoriesExceptSelected.length === 0) {
    differentCategory = null
  } else {
    const randomCategoryId =
      categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]?._id

    differentCategory = await Category.findById(randomCategoryId)
      .populate({
        path: "courses",
        match: { status: "Published" },
      })
      .exec()
  }

  // Get top-selling courses across all categories
  const allCategories = await Category.find()
    .populate({
      path: "courses",
      match: { status: "Published" },
    })
    .exec()
  const allCourses = allCategories.flatMap((category) => category.courses) //Flatten the result into one single array
  const mostSellingCourses = allCourses.sort((a, b) => b.sold - a.sold).slice(0, 10)

  res.status(200).json({
    success: true,
    data: {
      selectedCategory,
      differentCategory,
      mostSellingCourses,
    },
  })
})
