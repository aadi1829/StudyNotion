import { toast } from "react-hot-toast"

import { setToken } from "../../slices/authSlice"
import { setUser } from "../../slices/profileSlice"
import { apiRequest } from "../apiRequest"
import { settingsEndpoints } from "../apis"
import { logout } from "./authAPI"

const {
  UPDATE_DISPLAY_PICTURE_API,
  UPDATE_PROFILE_API,
  CHANGE_PASSWORD_API,
  DELETE_PROFILE_API,
} = settingsEndpoints

export function updateDisplayPicture(token, formData) {
  return async (dispatch) => {
    try {
      const data = await apiRequest({
        method: "PUT",
        url: UPDATE_DISPLAY_PICTURE_API,
        bodyData: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        errorMessage: "Could Not Update Display Picture",
      })
      toast.success("Display Picture Updated Successfully")
      dispatch(setUser(data.data))
    } catch (error) {
      // apiRequest already showed the error toast
    }
  }
}

export function updateProfile(token, formData) {
  return async (dispatch) => {
    try {
      const data = await apiRequest({
        method: "PUT",
        url: UPDATE_PROFILE_API,
        bodyData: formData,
        headers: { Authorization: `Bearer ${token}` },
        errorMessage: "Could Not Update Profile",
      })
      const userImage = data.updatedUserDetails.image
        ? data.updatedUserDetails.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${data.updatedUserDetails.firstName} ${data.updatedUserDetails.lastName}`
      dispatch(setUser({ ...data.updatedUserDetails, image: userImage }))
      toast.success("Profile Updated Successfully")
    } catch (error) {
      // apiRequest already showed the error toast
    }
  }
}

export function changePassword(token, formData) {
  return async (dispatch) => {
    try {
      const data = await apiRequest({
        method: "POST",
        url: CHANGE_PASSWORD_API,
        bodyData: formData,
        headers: { Authorization: `Bearer ${token}` },
        errorMessage: "Could Not Change Password",
      })

      // The old token is no longer valid once the password changes, so
      // swap in the fresh one the backend sends back and keep this
      // session logged in with it.
      dispatch(setToken(data.token))
      localStorage.setItem("token", JSON.stringify(data.token))

      toast.success("Password Changed Successfully")
    } catch (error) {
      // apiRequest already showed the error toast
    }
  }
}

export function deleteProfile(token, navigate) {
  return async (dispatch) => {
    try {
      await apiRequest({
        method: "DELETE",
        url: DELETE_PROFILE_API,
        headers: { Authorization: `Bearer ${token}` },
        errorMessage: "Could Not Delete Profile",
      })
      toast.success("Profile Deleted Successfully")
      dispatch(logout(navigate))
    } catch (error) {
      // apiRequest already showed the error toast
    }
  }
}
