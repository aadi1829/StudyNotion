import { toast } from "react-hot-toast"

import { apiConnector } from "./apiConnector"

// Centralizes the toast.loading -> apiConnector -> success-flag check ->
// toast.error -> toast.dismiss boilerplate that every services/operations/*API.js
// file used to repeat by hand. Callers still own the success toast/navigation,
// since those differ per call; on failure, this already shows an error toast
// and rethrows so the caller's catch block only needs to stop its own flow.
export async function apiRequest({
  method,
  url,
  bodyData = null,
  headers = null,
  params = null,
  dispatch = null,
  setLoadingAction = null,
  loadingMessage = "Loading...",
  errorMessage = "Something went wrong. Please try again.",
}) {
  const toastId = toast.loading(loadingMessage)
  if (dispatch && setLoadingAction) dispatch(setLoadingAction(true))

  try {
    const response = await apiConnector(method, url, bodyData, headers, params)
    if (!response?.data?.success) {
      throw new Error(response?.data?.message || errorMessage)
    }
    return response.data
  } catch (error) {
    toast.error(error.message || errorMessage)
    throw error
  } finally {
    toast.dismiss(toastId)
    if (dispatch && setLoadingAction) dispatch(setLoadingAction(false))
  }
}
