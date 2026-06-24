import { query } from "@/lib/db"
import { getUserIdFromToken, isAdminToken, normalizeAuthToken } from "@/lib/token-utils"

function safeParse(json) {
  if (!json) return null;
  try { return JSON.parse(json); } catch { return null; }
}

export async function GET(req, { params }) {
  try {
    const token = normalizeAuthToken(req.headers.get("authorization"))
    const userId = getUserIdFromToken(token)
    const adminAccess = isAdminToken(token)

    if (!userId && !adminAccess) {
      return Response.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return Response.json({ message: "Order ID is required" }, { status: 400 })
    }

    const orders = await query("SELECT * FROM orders WHERE id = ?", [id])

    if (!orders.length) {
      return Response.json({ message: "Order not found" }, { status: 404 })
    }

    const order = orders[0]

    if (!adminAccess && order.user_id !== userId) {
      return Response.json({ message: "Forbidden" }, { status: 403 })
    }

    const items = await query(
      `SELECT oi.product_id, oi.quantity, oi.price, p.name as product_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id],
    )

    return Response.json({
      ...order,
      shipping_address: safeParse(order.shipping_address),
      billing_address: safeParse(order.billing_address),
      items,
    })
  } catch (error) {
    console.error("[v0] Error fetching order:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const token = normalizeAuthToken(req.headers.get("authorization"))

    if (!isAdminToken(token)) {
      return Response.json({ message: "Unauthorized - Admin token required" }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return Response.json({ message: "Order ID is required" }, { status: 400 })
    }

    const { status } = await req.json()

    if (!status) {
      return Response.json({ message: "Status is required" }, { status: 400 })
    }

    await query("UPDATE orders SET status = ? WHERE id = ?", [status, id])
    return Response.json({ message: "Order updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating order:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
