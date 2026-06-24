import { query } from "@/lib/db"
import { getUserIdFromToken, isAdminToken, normalizeAuthToken } from "@/lib/token-utils"

export async function PUT(req, { params }) {
  try {
    const rawHeader = req.headers.get("authorization")
    const token = normalizeAuthToken(rawHeader)

    if (!token) {
      return Response.json({ message: "Unauthorized" }, { status: 401 })
    }

    const adminAccess = isAdminToken(token)
    const userId = getUserIdFromToken(token)

    const { id } = await params

    if (!id) {
      return Response.json({ message: "Appointment ID is required" }, { status: 400 })
    }

    const { status, notes } = await req.json()

    if (!status) {
      return Response.json({ message: "Status is required" }, { status: 400 })
    }

    if (adminAccess) {
      // Admin can set any status
      await query("UPDATE appointments SET status = ?, notes = ? WHERE id = ?", [status, notes || null, id])
      return Response.json({ message: "Appointment updated successfully" })
    }

    // Regular user: only allow cancelling their own pending/confirmed appointment
    if (!userId) {
      return Response.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (status !== "cancelled") {
      return Response.json({ message: "You can only cancel your own appointments" }, { status: 403 })
    }

    const appointments = await query("SELECT * FROM appointments WHERE id = ?", [id])
    if (!appointments.length) {
      return Response.json({ message: "Appointment not found" }, { status: 404 })
    }

    const appt = appointments[0]
    if (appt.user_id !== userId) {
      return Response.json({ message: "Forbidden" }, { status: 403 })
    }

    if (!["pending", "confirmed"].includes(appt.status)) {
      return Response.json({ message: "Only pending or confirmed appointments can be cancelled" }, { status: 400 })
    }

    await query("UPDATE appointments SET status = ?, notes = ? WHERE id = ?", [
      "cancelled",
      notes ?? appt.notes ?? null,
      id,
    ])

    return Response.json({ message: "Appointment cancelled successfully" })
  } catch (error) {
    console.error("[v0] Error updating appointment:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
