import { query } from "@/lib/db"
import { getUserIdFromToken, normalizeAuthToken } from "@/lib/token-utils"

export async function GET(req) {
  try {
    const token = normalizeAuthToken(req.headers.get("authorization"))
    const tokenUserId = getUserIdFromToken(token)

    if (!tokenUserId) {
      return Response.json({ message: "Unauthorized" }, { status: 401 })
    }

    const wishlistItems = await query(
      `SELECT p.* FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?`,
      [tokenUserId],
    )

    return Response.json({ wishlist: wishlistItems })
  } catch (error) {
    console.error("[v0] Error fetching wishlist:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const token = normalizeAuthToken(req.headers.get("authorization"))
    const tokenUserId = getUserIdFromToken(token)

    if (!tokenUserId) {
      return Response.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { productId } = await req.json()

    if (!productId) {
      return Response.json({ message: "Product ID required" }, { status: 400 })
    }

    // Check if already in wishlist
    const existing = await query("SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?", [tokenUserId, productId])

    if (existing.length) {
      // Remove from wishlist
      await query("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?", [tokenUserId, productId])
      return Response.json({ message: "Removed from wishlist", added: false })
    } else {
      // Add to wishlist
      await query("INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)", [tokenUserId, productId])
      return Response.json({ message: "Added to wishlist", added: true })
    }
  } catch (error) {
    console.error("[v0] Error updating wishlist:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
