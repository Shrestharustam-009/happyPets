import { query } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"

export async function GET(request) {
  try {
    if (!(await validateAdminRequest(request))) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const users = await query("SELECT COUNT(*) as count FROM users")
    const orders = await query("SELECT COUNT(*) as count FROM orders")
    const products = await query("SELECT COUNT(*) as count FROM products")
    const appointments = await query("SELECT COUNT(*) as count FROM appointments")
    const revenue = await query("SELECT SUM(total_amount) as total FROM orders WHERE status = ?", ["delivered"])

    return Response.json({
      totalUsers: users[0]?.count || 0,
      totalOrders: orders[0]?.count || 0,
      totalProducts: products[0]?.count || 0,
      totalAppointments: appointments[0]?.count || 0,
      totalRevenue: revenue[0]?.total || 0,
    })
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
