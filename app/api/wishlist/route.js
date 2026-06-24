import { query } from "@/lib/db"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return Response.json({ message: "User ID required" }, { status: 400 })
    }

    const wishlistItems = await query(
      `SELECT p.* FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?`,
      [userId],
    )

    return Response.json({ wishlist: wishlistItems })
  } catch (error) {
    console.error("[v0] Error fetching wishlist:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { userId, productId } = await req.json()

    if (!userId || !productId) {
      return Response.json({ message: "User ID and Product ID required" }, { status: 400 })
    }

    // Check if already in wishlist
    const existing = await query("SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?", [userId, productId])

    if (existing.length) {
      // Remove from wishlist
      await query("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?", [userId, productId])
      return Response.json({ message: "Removed from wishlist", added: false })
    } else {
      // Add to wishlist
      await query("INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)", [userId, productId])
      return Response.json({ message: "Added to wishlist", added: true })
    }
  } catch (error) {
    console.error("[v0] Error updating wishlist:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
