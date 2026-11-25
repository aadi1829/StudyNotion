import { toast } from "react-hot-toast"

import { setLoading, setToken } from "../../slices/authSlice"
import { resetCart } from "../../slices/cartSlice"
import { setUser } from "../../slices/profileSlice"
import { apiRequest } from "../apiRequest"
import { endpoints } from "../apis"

const {
  SENDOTP_API,
  SIGNUP_API,
  LOGIN_API,
  RESETPASSTOKEN_API,
  RESETPASSWORD_API,
} = endpoints

export function sendOtp(email, navigate) {
  return async (dispatch) => {
    try {
      await apiRequest({
        method: "POST",
        url: SENDOTP_API,
        bodyData: { email, checkUserPresent: true },
        dispatch,
        setLoadingAction: setLoading,
        errorMessage: "Could Not Send OTP",
      })
      toast.success("OTP Sent Successfully")
      navigate("/verify-email")
    } catch (error) {
      // apiRequest already showed the error toast
    }
  }
}

export function signUp(
  accountType,
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  otp,
  navigate
) {
  return async (dispatch) => {
    try {
      await apiRequest({
        method: "POST",
        url: SIGNUP_API,
        bodyData: {
          accountType,
          firstName,
          lastName,
          email,
          password,
          confirmPassword,
          otp,
        },
        dispatch,
        setLoadingAction: setLoading,
        errorMessage: "Signup Failed",
      })
      toast.success("Signup Successful")
      navigate("/login")
    } catch (error) {
      navigate("/signup")
    }
  }
}

export function login(email, password, navigate) {
  return async (dispatch) => {
    try {
      const data = await apiRequest({
        method: "POST",
        url: LOGIN_API,
        bodyData: { email, password },
        dispatch,
        setLoadingAction: setLoading,
        errorMessage: "Login Failed",
      })

      toast.success("Login Successful")
      dispatch(setToken(data.token))
      const userImage = data.user?.image
        ? data.user.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${data.user.firstName} ${data.user.lastName}`
      dispatch(setUser({ ...data.user, image: userImage }))
      localStorage.setItem("token", JSON.stringify(data.token))
      navigate("/dashboard/my-profile")
    } catch (error) {
      // apiRequest already showed the error toast
    }
  }
}

export function getPasswordResetToken(email, setEmailSent) {
  return async (dispatch) => {
    try {
      await apiRequest({
        method: "POST",
        url: RESETPASSTOKEN_API,
        bodyData: { email },
        dispatch,
        setLoadingAction: setLoading,
        errorMessage: "Failed To Send Reset Email",
      })
      toast.success("Reset Email Sent")
      setEmailSent(true)
    } catch (error) {
      // apiRequest already showed the error toast
    }
  }
}

export function resetPassword(password, confirmPassword, token, navigate) {
  return async (dispatch) => {
    try {
      await apiRequest({
        method: "POST",
        url: RESETPASSWORD_API,
        bodyData: { password, confirmPassword, token },
        dispatch,
        setLoadingAction: setLoading,
        errorMessage: "Failed To Reset Password",
      })
      toast.success("Password Reset Successfully")
      navigate("/login")
    } catch (error) {
      // apiRequest already showed the error toast
    }
  }
}

export function logout(navigate) {
  return (dispatch) => {
    dispatch(setToken(null))
    dispatch(setUser(null))
    dispatch(resetCart())
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    toast.success("Logged Out")
    navigate("/")
  }
}
