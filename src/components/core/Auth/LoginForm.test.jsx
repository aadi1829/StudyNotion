import { configureStore } from "@reduxjs/toolkit"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Provider } from "react-redux"
import { MemoryRouter } from "react-router-dom"

import { login } from "../../../services/operations/authAPI"
import LoginForm from "./LoginForm"

jest.mock("../../../services/operations/authAPI", () => ({
  login: jest.fn(() => ({ type: "noop" })),
}))

function renderLoginForm() {
  const store = configureStore({
    reducer: { auth: () => ({}) },
  })
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    </Provider>
  )
}

beforeEach(() => {
  // CRA's Jest config sets resetMocks: true, wiping the jest.mock
  // factory's default implementation before every test - re-set it here.
  login.mockReturnValue({ type: "noop" })
})

describe("LoginForm", () => {
  it("dispatches login with the entered email/password on submit", () => {
    renderLoginForm()

    userEvent.type(screen.getByPlaceholderText("Enter email address"), "jane@example.com")
    userEvent.type(screen.getByPlaceholderText("Enter Password"), "Password123")
    userEvent.click(screen.getByRole("button", { name: "Sign In" }))

    expect(login).toHaveBeenCalledWith("jane@example.com", "Password123", expect.any(Function))
  })

  it("marks email and password as required (relies on native browser validation)", () => {
    renderLoginForm()

    expect(screen.getByPlaceholderText("Enter email address")).toBeRequired()
    expect(screen.getByPlaceholderText("Enter Password")).toBeRequired()
  })

  it("toggles the password field between masked and visible text", () => {
    renderLoginForm()

    const passwordInput = screen.getByPlaceholderText("Enter Password")
    expect(passwordInput).toHaveAttribute("type", "password")

    // The eye icon toggle is the only other interactive element in that
    // label. fireEvent.click (not userEvent.click) because this version of
    // user-event predates React 18 and doesn't reliably flush this state
    // update before the assertion below runs.
    const toggle = passwordInput.parentElement.querySelector("span")
    fireEvent.click(toggle)

    expect(passwordInput).toHaveAttribute("type", "text")
  })
})
