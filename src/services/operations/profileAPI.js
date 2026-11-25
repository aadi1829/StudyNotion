import { setLoading, setUser } from "../../slices/profileSlice"
import { apiRequest } from "../apiRequest"
import { profileEndpoints } from "../apis"
import { logout } from "./authAPI"

const {
  GET_USER_DETAILS_API,
  GET_USER_ENROLLED_COURSES_API,
  GET_INSTRUCTOR_DATA_API,
} = profileEndpoints

export function getUserDetails(token, navigate) {
  return async (dispatch) => {
    try {
      const data = await apiRequest({
        method: "GET",
        url: GET_USER_DETAILS_API,
        headers: { Authorization: `Bearer ${token}` },
        dispatch,
        setLoadingAction: setLoading,
        errorMessage: "Could Not Get User Details",
      })
      const userImage = data.data.image
        ? data.data.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${data.data.firstName} ${data.data.lastName}`
      dispatch(setUser({ ...data.data, image: userImage }))
    } catch (error) {
      dispatch(logout(navigate))
    }
  }
}

export async function getUserEnrolledCourses(token) {
  try {
    const data = await apiRequest({
      method: "GET",
      url: GET_USER_ENROLLED_COURSES_API,
      headers: { Authorization: `Bearer ${token}` },
      errorMessage: "Could Not Get Enrolled Courses",
    })
    return data.data
  } catch (error) {
    return []
  }
}

export async function getInstructorData(token) {
  try {
    const data = await apiRequest({
      method: "GET",
      url: GET_INSTRUCTOR_DATA_API,
      headers: { Authorization: `Bearer ${token}` },
      errorMessage: "Could Not Get Instructor Data",
    })
    return data.courses
  } catch (error) {
    return []
  }
}
