import { configureStore } from "@reduxjs/toolkit"
import { render, screen } from "@testing-library/react"
import { Provider } from "react-redux"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import PrivateRoute from "./PrivateRoute"

function renderWithToken(token) {
  const store = configureStore({
    reducer: { auth: () => ({ token }) },
  })

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <div>Protected Content</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  )
}

describe("PrivateRoute", () => {
  it("renders the protected content when a token is present", () => {
    renderWithToken("some-jwt-token")

    expect(screen.getByText("Protected Content")).toBeInTheDocument()
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument()
  })

  it("redirects to /login when there is no token", () => {
    renderWithToken(null)

    expect(screen.getByText("Login Page")).toBeInTheDocument()
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument()
  })
})
