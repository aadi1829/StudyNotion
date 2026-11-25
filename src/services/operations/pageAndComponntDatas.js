import { apiRequest } from "../apiRequest"
import { catalogData } from "../apis"

export const getCatalogPageData = async (categoryId) => {
  try {
    const data = await apiRequest({
      method: "POST",
      url: catalogData.CATALOGPAGEDATA_API,
      bodyData: { categoryId },
      errorMessage: "Could Not Fetch Category page data.",
    })
    return data
  } catch (error) {
    return { success: false, message: error.message }
  }
}
