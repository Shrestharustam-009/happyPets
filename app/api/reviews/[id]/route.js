import { query } from "@/lib/db"
import { verifyAdminToken } from "@/lib/auth-middleware"

export async function DELETE(req, { params }) {
  try {
    const { id } = await params
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    const adminUser = await verifyAdminToken(token)
    if (!adminUser || adminUser.role !== 'admin') {
      return Response.json({ message: "Forbidden: Only administrators can delete records" }, { status: 403 })
    }

    await query("DELETE FROM product_reviews WHERE id = ?", [id])
    return Response.json({ message: "Review deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting review:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    const adminUser = await verifyAdminToken(token)
    if (!adminUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { rating, review_text } = await req.json()
    if (rating === undefined || !review_text) {
      return Response.json({ message: "Missing rating or review_text" }, { status: 400 })
    }

    await query(
      `UPDATE product_reviews
       SET rating = ?, review_text = ?
       WHERE id = ?`,
      [rating, review_text, id]
    )

    return Response.json({ message: "Review updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating review:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
