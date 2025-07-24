const Category = require("../models/Category")

function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" })
    }

    const existingCategory = await Category.findOne({ name: name });

    if(existingCategory){
      return res.status(401).json({
        success:false,
        message:"Category already exist"
      })
    }
    const CategorysDetails = await Category.create({
      name: name,
      description: description,
    })
    console.log(CategorysDetails)
    return res.status(200).json({
      success: true,
      message: "Category Created Successfully",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.showAllCategories = async (req, res) => {
  try {
    const allCategories = await Category.find()

    if (allCategories.length === 0) {
         return res.status(404).json({
          success: false,
          message: "No categories found",
        })
      }     

      res.status(200).json({
          success: true,
          message: "All categories fetched successfully",
          data: allCategories,
        })
        
  } catch (error) {
      console.error("Error retrieving categories:", error.message)
      return res.status(500).json({
      success: false,
      message:"Something went wrong while fetching categories",
    })
  }
}

//All published courses in the selected category.
//The top 10 best-selling courses across all categories.
//Published courses in another (random) category.
exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body
    
    const selectedCategory = await Category.findById(categoryId)
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: "ratingAndReviews",
      })
      .exec()

    console.log("SELECTED COURSE", selectedCategory)

    if (!selectedCategory) {
      console.log("Category not found.")
      return res.status(404).json(
        { success: false, message: "Category not found" }
      )
    }

    if (selectedCategory.courses.length === 0) { //No course found for this category
      console.log("No courses found for the selected category.")
      return res.status(404).json({
        success: false,
        message: "No courses found for the selected category.",
      })
    }

    // Get courses for other categories
    const categoriesExceptSelected = await Category.find({
      _id: { $ne: categoryId },
    })

    let differentCategory;
    if (categoriesExceptSelected.length === 0) {
      differentCategory = null;
    } else {
      const randomCategoryId = categoriesExceptSelected[
        getRandomInt(categoriesExceptSelected.length)
      ]?._id
    
      differentCategory = await Category.findById(randomCategoryId).populate({
        path: "courses",
        match: { status: "Published" },
      }).exec()
    }
    
    // Get top-selling courses across all categories
    const allCategories = await Category.find()
      .populate({
        path: "courses",
        match: { status: "Published" },
      })
      .exec()
    const allCourses = allCategories.flatMap((category) => category.courses)//Flatten the result into one single array
    const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10)

    res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategory,
        mostSellingCourses,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}
