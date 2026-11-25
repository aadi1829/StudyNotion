import { toast } from "react-hot-toast"

import { apiConnector } from "./apiConnector"
import { apiRequest } from "./apiRequest"

jest.mock("./apiConnector")
jest.mock("react-hot-toast", () => ({
  toast: {
    loading: jest.fn(() => "toast-id"),
    error: jest.fn(),
    dismiss: jest.fn(),
  },
}))

beforeEach(() => {
  // CRA's Jest config sets resetMocks: true, which wipes mock
  // implementations (not just call history) before every test - including
  // the one the jest.mock factory above set up. Re-establish it here.
  toast.loading.mockReturnValue("toast-id")
})

describe("apiRequest", () => {
  it("returns response.data on a successful call", async () => {
    apiConnector.mockResolvedValue({ data: { success: true, message: "ok", value: 42 } })

    const result = await apiRequest({ method: "GET", url: "/some-url" })

    expect(result).toEqual({ success: true, message: "ok", value: 42 })
    expect(apiConnector).toHaveBeenCalledWith("GET", "/some-url", null, null, null)
    expect(toast.loading).toHaveBeenCalledWith("Loading...")
    expect(toast.dismiss).toHaveBeenCalledWith("toast-id")
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("throws and shows the backend's message when success is false", async () => {
    apiConnector.mockResolvedValue({ data: { success: false, message: "Backend says no" } })

    await expect(
      apiRequest({ method: "POST", url: "/x", errorMessage: "fallback" })
    ).rejects.toThrow("Backend says no")

    expect(toast.error).toHaveBeenCalledWith("Backend says no")
    expect(toast.dismiss).toHaveBeenCalledWith("toast-id")
  })

  it("falls back to errorMessage when the backend sends no message", async () => {
    apiConnector.mockResolvedValue({ data: { success: false } })

    await expect(
      apiRequest({ method: "POST", url: "/x", errorMessage: "Could Not Do The Thing" })
    ).rejects.toThrow("Could Not Do The Thing")

    expect(toast.error).toHaveBeenCalledWith("Could Not Do The Thing")
  })

  it("falls back to errorMessage when apiConnector itself rejects with no message", async () => {
    const networkError = new Error()
    apiConnector.mockRejectedValue(networkError)

    await expect(
      apiRequest({ method: "GET", url: "/x", errorMessage: "Network trouble" })
    ).rejects.toThrow()

    expect(toast.error).toHaveBeenCalledWith("Network trouble")
  })

  it("dispatches setLoadingAction(true) then (false) around the call, even on failure", async () => {
    apiConnector.mockRejectedValue(new Error("boom"))
    const dispatch = jest.fn()
    const setLoadingAction = jest.fn((value) => ({ type: "setLoading", payload: value }))

    await expect(
      apiRequest({ method: "GET", url: "/x", dispatch, setLoadingAction })
    ).rejects.toThrow("boom")

    expect(dispatch).toHaveBeenNthCalledWith(1, { type: "setLoading", payload: true })
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: "setLoading", payload: false })
  })

  it("does not touch dispatch when setLoadingAction is not provided", async () => {
    apiConnector.mockResolvedValue({ data: { success: true } })
    const dispatch = jest.fn()

    await apiRequest({ method: "GET", url: "/x", dispatch })

    expect(dispatch).not.toHaveBeenCalled()
  })
})
