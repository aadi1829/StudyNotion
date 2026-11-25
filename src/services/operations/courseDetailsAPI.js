import { toast } from "react-hot-toast"

import { apiRequest } from "../apiRequest"
import { courseEndpoints } from "../apis"

const {
  COURSE_DETAILS_API,
  COURSE_CATEGORIES_API,
  GET_ALL_COURSE_API,
  CREATE_COURSE_API,
  EDIT_COURSE_API,
  CREATE_SECTION_API,
  CREATE_SUBSECTION_API,
  UPDATE_SECTION_API,
  UPDATE_SUBSECTION_API,
  DELETE_SECTION_API,
  DELETE_SUBSECTION_API,
  GET_ALL_INSTRUCTOR_COURSES_API,
  DELETE_COURSE_API,
  GET_FULL_COURSE_DETAILS_AUTHENTICATED,
  CREATE_RATING_API,
  LECTURE_COMPLETION_API,
} = courseEndpoints

export const getAllCourses = async () => {
  try {
    const data = await apiRequest({
      method: "GET",
      url: GET_ALL_COURSE_API,
      errorMessage: "Could Not Fetch Courses",
    })
    return data.data
  } catch (error) {
    return []
  }
}

export const fetchCourseDetails = async (courseId) => {
  try {
    const data = await apiRequest({
      method: "POST",
      url: COURSE_DETAILS_API,
      bodyData: { courseId },
      errorMessage: "Could Not Fetch Course Details",
    })
    return data
  } catch (error) {
    return { success: false, message: error.message }
  }
}

// fetching the available course categories
export const fetchCourseCategories = async () => {
  try {
    const data = await apiRequest({
      method: "GET",
      url: COURSE_CATEGORIES_API,
      errorMessage: "Could Not Fetch Course Categories",
    })
    return data.data
  } catch (error) {
    return []
  }
}

// add the course details
export const addCourseDetails = async (data, token) => {
  try {
    const result = await apiRequest({
      method: "POST",
      url: CREATE_COURSE_API,
      bodyData: data,
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      errorMessage: "Could Not Add Course Details",
    })
    toast.success("Course Details Added Successfully")
    return result.data
  } catch (error) {
    return null
  }
}

// edit the course details
export const editCourseDetails = async (data, token) => {
  try {
    const result = await apiRequest({
      method: "POST",
      url: EDIT_COURSE_API,
      bodyData: data,
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      errorMessage: "Could Not Update Course Details",
    })
    toast.success("Course Details Updated Successfully")
    return result.data
  } catch (error) {
    return null
  }
}

// create a section
export const createSection = async (data, token) => {
  try {
    const result = await apiRequest({
      method: "POST",
      url: CREATE_SECTION_API,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
      errorMessage: "Could Not Create Section",
    })
    toast.success("Course Section Created")
    return result.updatedCourse
  } catch (error) {
    return null
  }
}

// create a subsection
export const createSubSection = async (data, token) => {
  try {
    const result = await apiRequest({
      method: "POST",
      url: CREATE_SUBSECTION_API,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
      errorMessage: "Could Not Add Lecture",
    })
    toast.success("Lecture Added")
    return result.data
  } catch (error) {
    return null
  }
}

// update a section
export const updateSection = async (data, token) => {
  try {
    const result = await apiRequest({
      method: "POST",
      url: UPDATE_SECTION_API,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
      errorMessage: "Could Not Update Section",
    })
    toast.success("Course Section Updated")
    return result.data
  } catch (error) {
    return null
  }
}

// update a subsection
export const updateSubSection = async (data, token) => {
  try {
    const result = await apiRequest({
      method: "POST",
      url: UPDATE_SUBSECTION_API,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
      errorMessage: "Could Not Update Lecture",
    })
    toast.success("Lecture Updated")
    return result.data
  } catch (error) {
    return null
  }
}

// delete a section
export const deleteSection = async (data, token) => {
  try {
    const result = await apiRequest({
      method: "POST",
      url: DELETE_SECTION_API,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
      errorMessage: "Could Not Delete Section",
    })
    toast.success("Course Section Deleted")
    return result.data
  } catch (error) {
    return null
  }
}

// delete a subsection
export const deleteSubSection = async (data, token) => {
  try {
    const result = await apiRequest({
      method: "POST",
      url: DELETE_SUBSECTION_API,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
      errorMessage: "Could Not Delete Lecture",
    })
    toast.success("Lecture Deleted")
    return result.data
  } catch (error) {
    return null
  }
}

// fetching all courses under a specific instructor
export const fetchInstructorCourses = async (token) => {
  try {
    const result = await apiRequest({
      method: "GET",
      url: GET_ALL_INSTRUCTOR_COURSES_API,
      headers: { Authorization: `Bearer ${token}` },
      errorMessage: "Could Not Fetch Instructor Courses",
    })
    return result.data
  } catch (error) {
    return []
  }
}

// delete a course
export const deleteCourse = async (data, token) => {
  try {
    await apiRequest({
      method: "DELETE",
      url: DELETE_COURSE_API,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
      errorMessage: "Could Not Delete Course",
    })
    toast.success("Course Deleted")
  } catch (error) {
    // apiRequest already showed the error toast
  }
}

// get full details of a course
export const getFullDetailsOfCourse = async (courseId, token) => {
  try {
    const result = await apiRequest({
      method: "POST",
      url: GET_FULL_COURSE_DETAILS_AUTHENTICATED,
      bodyData: { courseId },
      headers: { Authorization: `Bearer ${token}` },
      errorMessage: "Could Not Fetch Course Details",
    })
    return result.data
  } catch (error) {
    return { success: false, message: error.message }
  }
}

// mark a lecture as complete
export const markLectureAsComplete = async (data, token) => {
  try {
    await apiRequest({
      method: "POST",
      url: LECTURE_COMPLETION_API,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
      errorMessage: "Could Not Mark Lecture Complete",
    })
    toast.success("Lecture Completed")
    return true
  } catch (error) {
    return false
  }
}

// create a rating for course
export const createRating = async (data, token) => {
  try {
    await apiRequest({
      method: "POST",
      url: CREATE_RATING_API,
      bodyData: data,
      headers: { Authorization: `Bearer ${token}` },
      errorMessage: "Could Not Create Rating",
    })
    toast.success("Rating Created")
    return true
  } catch (error) {
    return false
  }
}
