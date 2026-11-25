import { createSlice } from "@reduxjs/toolkit"
import { toast } from "react-hot-toast"

const CART_STORAGE_KEY = "cart"

function loadCartFromStorage() {
  const defaultState = { cart: [], total: 0, totalItems: 0 }
  const stored = localStorage.getItem(CART_STORAGE_KEY)
  if (!stored) return defaultState

  // Older versions stored the cart array under this same key, split across
  // separate "total"/"totalItems" keys; fall back to defaults for that shape
  // instead of crashing, since there's nothing to migrate it from reliably.
  const parsed = JSON.parse(stored)
  if (!parsed || !Array.isArray(parsed.cart)) return defaultState
  return parsed
}

function saveCartToStorage(state) {
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({
      cart: state.cart,
      total: state.total,
      totalItems: state.totalItems,
    })
  )
}

const initialState = loadCartFromStorage()

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const course = action.payload
      const index = state.cart.findIndex((item) => item._id === course._id)

      if (index >= 0) {
        // If the course is already in the cart, do not modify the quantity
        toast.error("Course already in cart")
        return
      }
      // If the course is not in the cart, add it to the cart
      state.cart.push(course)
      // Update the total quantity and price
      state.totalItems++
      state.total += course.price
      saveCartToStorage(state)
      // show toast
      toast.success("Course added to cart")
    },
    removeFromCart: (state, action) => {
      const courseId = action.payload
      const index = state.cart.findIndex((item) => item._id === courseId)

      if (index >= 0) {
        // If the course is found in the cart, remove it
        state.totalItems--
        state.total -= state.cart[index].price
        state.cart.splice(index, 1)
        saveCartToStorage(state)
        // show toast
        toast.success("Course removed from cart")
      }
    },
    resetCart: (state) => {
      state.cart = []
      state.total = 0
      state.totalItems = 0
      localStorage.removeItem(CART_STORAGE_KEY)
    },
  },
})

export const { addToCart, removeFromCart, resetCart } = cartSlice.actions

export default cartSlice.reducer
