import { query } from "@/lib/db"
import { getUserIdFromToken, normalizeAuthToken, isAdminToken } from "@/lib/token-utils"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const scope = searchParams.get("scope")
    const explicitUserId = searchParams.get("user_id")

    const token = normalizeAuthToken(req.headers.get("authorization"))
    const isAdmin = isAdminToken(token)
    const tokenUserId = getUserIdFromToken(token)

    if (!isAdmin && !tokenUserId) {
      return Response.json({ message: "Unauthorized" }, { status: 401 })
    }

    const filters = []
    const params = []

    // Regular users can only see their own orders. Admins can see all, or filter by explicitUserId.
    if (!isAdmin) {
      filters.push("o.user_id = ?")
      params.push(tokenUserId)
    } else if (explicitUserId) {
      filters.push("o.user_id = ?")
      params.push(explicitUserId)
    }

    if (status) {
      filters.push("o.status = ?")
      params.push(status)
    }

    let sql = `SELECT o.id, o.order_number, o.user_id, o.total_amount, o.status, o.payment_method, o.created_at,
                      u.full_name as customerName,
                      (SELECT COALESCE(SUM(quantity),0) FROM order_items oi WHERE oi.order_id = o.id) AS itemCount
               FROM orders o
               LEFT JOIN users u ON o.user_id = u.id`

    if (filters.length) {
      sql += ` WHERE ${filters.join(" AND ")}`
    }

    sql += " ORDER BY o.created_at DESC"

    const orders = await query(sql, params)
    return Response.json(orders)
  } catch (error) {
    console.error("[v0] Error fetching orders:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
