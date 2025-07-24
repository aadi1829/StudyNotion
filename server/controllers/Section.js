const Section = require("../models/Section")
const Course = require("../models/Course")
const SubSection = require("../models/Subsection")
// CREATE a new section
exports.createSection = async (req, res) => {
  try {
    const { sectionName, courseId } = req.body
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing required properties",
      })
    }
    const newSection = await Section.create({ sectionName })//create new section
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    )
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      return res.status(200).json({
          success: true,
          message: `Section '${sectionName}' created and linked to course.`,
          updatedCourse,
        });
        
  } catch (error) {
    console.error("Error while creating section:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

// UPDATE a section
exports.updateSection = async (req, res) => {
  try {
    const { sectionName, sectionId, courseId } = req.body
    
    if (!sectionName || !sectionId || !courseId) {
        return res.status(400).json({
          success: false,
          message: "Please provide sectionName, sectionId, and courseId",
        });
      }
      
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    )
    
    if (!updatedSection) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const updatedCourse = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })

    console.log(updatedCourse)

    res.status(200).json({
      success: true,
      message: "Section updated successfully",
      section: updatedSection,
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({
      success: false,
      message: "Error updating section",
      error: error.message,
    });
  }
}

// DELETE a section
exports.deleteSection = async (req, res) => {
  try {
    const { sectionId, courseId } = req.body

    if (!sectionId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Section ID and Course ID are required",
      });
    }

    await Course.findByIdAndUpdate(courseId, {
      $pull: {
        courseContent: sectionId,
      },
    })
    const section = await Section.findById(sectionId)
    console.log(sectionId, courseId)
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      })
    }
    // Delete the associated subsections
    //_id -> refer to the subSectionID 
    await SubSection.deleteMany({ _id: { $in: section.subSection } })

    await Section.findByIdAndDelete(sectionId)

    // find the updated course and return it
    const course = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })

    res.status(200).json({
      success: true,
      message: "Section and its subsections deleted successfully",
      data: course,
    })
  } catch (error) {
    console.error("Error deleting section:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}
