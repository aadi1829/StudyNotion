import { configureStore } from "@reduxjs/toolkit"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "react-hot-toast"
import { Provider } from "react-redux"
import { MemoryRouter } from "react-router-dom"

import { sendOtp } from "../../../services/operations/authAPI"
import SignupForm from "./SignupForm"

jest.mock("react-hot-toast", () => ({
  toast: { error: jest.fn() },
}))
jest.mock("../../../services/operations/authAPI", () => ({
  sendOtp: jest.fn(() => ({ type: "noop" })),
}))

function renderSignupForm() {
  const store = configureStore({
    reducer: { auth: () => ({}) },
  })
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <SignupForm />
      </MemoryRouter>
    </Provider>
  )
}

function fillForm({ password, confirmPassword }) {
  userEvent.type(screen.getByPlaceholderText("Enter first name"), "Jane")
  userEvent.type(screen.getByPlaceholderText("Enter last name"), "Doe")
  userEvent.type(screen.getByPlaceholderText("Enter email address"), "jane@example.com")
  userEvent.type(screen.getByPlaceholderText("Enter Password"), password)
  userEvent.type(screen.getByPlaceholderText("Confirm Password"), confirmPassword)
}

beforeEach(() => {
  // CRA's Jest config sets resetMocks: true, wiping the jest.mock
  // factory's default implementation before every test - re-set it here.
  sendOtp.mockReturnValue({ type: "noop" })
})

describe("SignupForm client-side validation", () => {
  it("blocks submission and shows an error when passwords don't match", () => {
    renderSignupForm()

    fillForm({ password: "Password123", confirmPassword: "Different123" })
    userEvent.click(screen.getByRole("button", { name: "Create Account" }))

    expect(toast.error).toHaveBeenCalledWith("Passwords Do Not Match")
    expect(sendOtp).not.toHaveBeenCalled()
  })

  it("submits (sends OTP) when passwords match", () => {
    renderSignupForm()

    fillForm({ password: "Password123", confirmPassword: "Password123" })
    userEvent.click(screen.getByRole("button", { name: "Create Account" }))

    expect(toast.error).not.toHaveBeenCalled()
    expect(sendOtp).toHaveBeenCalledWith("jane@example.com", expect.any(Function))
  })
})
