import { query } from "@/lib/db"
import { verifyAdminToken } from "@/lib/auth-middleware"

export async function PUT(req, { params }) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    const adminUser = await verifyAdminToken(token)
    if (!adminUser || adminUser.role !== 'admin') {
      return Response.json({ message: "Forbidden: Only administrators can modify records" }, { status: 403 })
    }

    const { id } = await params
    const {
      name = null,
      description = null,
      price = null,
      duration_minutes = null,
    } = await req.json()

    if (!name) {
      return Response.json({ message: "Service name is required" }, { status: 400 })
    }

    // Normalize optional fields so we never pass undefined into the query bindings
    const finalDescription = description === "" ? null : description
    const finalPrice = price === "" || price === undefined || price === null ? null : price
    const finalDuration =
      duration_minutes === "" || duration_minutes === undefined || duration_minutes === null
        ? null
        : duration_minutes

    await query(`UPDATE services SET name = ?, description = ?, price = ?, duration_minutes = ? WHERE id = ?`, [
      name,
      finalDescription,
      finalPrice,
      finalDuration,
      id,
    ])

    return Response.json({ message: "Service updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating service:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    const adminUser = await verifyAdminToken(token)
    if (!adminUser || adminUser.role !== 'admin') {
      return Response.json({ message: "Forbidden: Only administrators can delete records" }, { status: 403 })
    }

    const { id } = await params
    await query("UPDATE services SET is_active = FALSE WHERE id = ?", [id])
    return Response.json({ message: "Service deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting service:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
