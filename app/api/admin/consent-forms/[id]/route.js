import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyAdminToken } from "@/lib/auth-middleware"

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const adminUser = await verifyAdminToken(token)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden: Only administrators can delete records" }, { status: 403 })
    }

    await query("DELETE FROM consent_forms WHERE id = ?", [id])

    return NextResponse.json({ message: "Consent form deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting consent form:", error)
    return NextResponse.json({ error: "Failed to delete consent form" }, { status: 500 })
  }
}
