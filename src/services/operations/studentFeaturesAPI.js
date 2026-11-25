import { toast } from "react-hot-toast"

import rzpLogo from "../../assets/Logo/rzp_logo.png"
import { resetCart } from "../../slices/cartSlice"
import { setPaymentLoading } from "../../slices/courseSlice"
import { apiRequest } from "../apiRequest"
import { studentEndpoints } from "../apis"

const {
  COURSE_PAYMENT_API,
  COURSE_VERIFY_API,
  SEND_PAYMENT_SUCCESS_EMAIL_API,
} = studentEndpoints

// Load the Razorpay SDK from the CDN
function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = src
    script.onload = () => {
      resolve(true)
    }
    script.onerror = () => {
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

// Buy the Course
export async function BuyCourse(
  token,
  courses,
  user_details,
  navigate,
  dispatch
) {
  try {
    // Loading the script of Razorpay SDK
    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js")

    if (!res) {
      toast.error(
        "Razorpay SDK failed to load. Check your Internet Connection."
      )
      return
    }

    // Initiating the Order in Backend
    const orderData = await apiRequest({
      method: "POST",
      url: COURSE_PAYMENT_API,
      bodyData: { courses },
      headers: { Authorization: `Bearer ${token}` },
      errorMessage: "Could Not make Payment.",
    })

    // Opening the Razorpay SDK
    const options = {
      key: process.env.RAZORPAY_KEY,
      currency: orderData.data.currency,
      amount: `${orderData.data.amount}`,
      order_id: orderData.data.id,
      name: "StudyNotion",
      description: "Thank you for Purchasing the Course.",
      image: rzpLogo,
      prefill: {
        name: `${user_details.firstName} ${user_details.lastName}`,
        email: user_details.email,
      },
      handler: function (response) {
        sendPaymentSuccessEmail(response, orderData.data.amount, token)
        verifyPayment({ ...response, courses }, token, navigate, dispatch)
      },
    }
    const paymentObject = new window.Razorpay(options)

    paymentObject.open()
    paymentObject.on("payment.failed", function () {
      toast.error("Oops! Payment Failed.")
    })
  } catch (error) {
    // apiRequest already showed the error toast
  }
}

// Verify the Payment
async function verifyPayment(bodyData, token, navigate, dispatch) {
  try {
    await apiRequest({
      method: "POST",
      url: COURSE_VERIFY_API,
      bodyData,
      headers: { Authorization: `Bearer ${token}` },
      dispatch,
      setLoadingAction: setPaymentLoading,
      loadingMessage: "Verifying Payment...",
      errorMessage: "Could Not Verify Payment.",
    })

    toast.success("Payment Successful. You are Added to the course ")
    navigate("/dashboard/enrolled-courses")
    dispatch(resetCart())
  } catch (error) {
    // apiRequest already showed the error toast
  }
}

// Send the Payment Success Email
async function sendPaymentSuccessEmail(response, amount, token) {
  try {
    await apiRequest({
      method: "POST",
      url: SEND_PAYMENT_SUCCESS_EMAIL_API,
      bodyData: {
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        amount,
      },
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (error) {
    // best-effort email; failure here shouldn't block the purchase flow
  }
}
