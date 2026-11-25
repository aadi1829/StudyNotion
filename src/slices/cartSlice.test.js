import { toast } from "react-hot-toast"

import cartReducer, { addToCart, removeFromCart, resetCart } from "./cartSlice"

jest.mock("react-hot-toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const course = (id, price) => ({ _id: id, price })

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
})

describe("cartSlice reducer", () => {
  const emptyState = { cart: [], total: 0, totalItems: 0 }

  it("adds a course to an empty cart", () => {
    const state = cartReducer(emptyState, addToCart(course("c1", 100)))

    expect(state.cart).toHaveLength(1)
    expect(state.total).toBe(100)
    expect(state.totalItems).toBe(1)
    expect(toast.success).toHaveBeenCalledWith("Course added to cart")
  })

  it("refuses to add the same course twice", () => {
    const withCourse = cartReducer(emptyState, addToCart(course("c1", 100)))
    const state = cartReducer(withCourse, addToCart(course("c1", 100)))

    expect(state.cart).toHaveLength(1)
    expect(state.total).toBe(100)
    expect(state.totalItems).toBe(1)
    expect(toast.error).toHaveBeenCalledWith("Course already in cart")
  })

  it("removes a course from the cart", () => {
    const withTwoCourses = cartReducer(
      cartReducer(emptyState, addToCart(course("c1", 100))),
      addToCart(course("c2", 250))
    )

    const state = cartReducer(withTwoCourses, removeFromCart("c1"))

    expect(state.cart).toHaveLength(1)
    expect(state.cart[0]._id).toBe("c2")
    expect(state.total).toBe(250)
    expect(state.totalItems).toBe(1)
    expect(toast.success).toHaveBeenCalledWith("Course removed from cart")
  })

  it("does nothing when removing a course that isn't in the cart", () => {
    const withCourse = cartReducer(emptyState, addToCart(course("c1", 100)))
    jest.clearAllMocks() // fixture setup above already triggered a toast call
    const state = cartReducer(withCourse, removeFromCart("does-not-exist"))

    expect(state).toEqual(withCourse)
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("resets the cart", () => {
    const withCourse = cartReducer(emptyState, addToCart(course("c1", 100)))
    const state = cartReducer(withCourse, resetCart())

    expect(state).toEqual(emptyState)
  })

  it("persists cart/total/totalItems under a single localStorage key", () => {
    cartReducer(emptyState, addToCart(course("c1", 100)))

    expect(localStorage.getItem("cart")).toBe(
      JSON.stringify({ cart: [course("c1", 100)], total: 100, totalItems: 1 })
    )
    // The old three-key format should never be written.
    expect(localStorage.getItem("total")).toBeNull()
    expect(localStorage.getItem("totalItems")).toBeNull()
  })

  it("clears localStorage on resetCart", () => {
    cartReducer(emptyState, addToCart(course("c1", 100)))
    expect(localStorage.getItem("cart")).not.toBeNull()

    cartReducer(emptyState, resetCart())
    expect(localStorage.getItem("cart")).toBeNull()
  })
})
