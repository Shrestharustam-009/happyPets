import { query } from "@/lib/db"
import { verifyAdminToken } from "@/lib/auth-middleware"

export async function GET(req) {
  try {
    const reviews = await query(
      `SELECT pr.id, pr.user_id, pr.rating, pr.review_text, pr.created_at,
              u.full_name as userName
       FROM product_reviews pr
       LEFT JOIN users u ON pr.user_id = u.id
       ORDER BY pr.created_at DESC`,
    )
    return Response.json(reviews)
  } catch (error) {
    console.error("[v0] Error fetching reviews:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    const adminUser = await verifyAdminToken(token)
    if (!adminUser) {
      return Response.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { user_id, rating, review_text } = await req.json()
    if (!user_id || rating === undefined || !review_text) {
      return Response.json({ message: "Missing required fields" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO product_reviews (product_id, user_id, rating, review_text, created_at)
       VALUES (NULL, ?, ?, ?, NOW())`,
      [user_id, rating, review_text]
    )

    return Response.json({ message: "Review created successfully", id: result.insertId })
  } catch (error) {
    console.error("[v0] Error creating review:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
