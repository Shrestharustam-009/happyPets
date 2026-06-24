import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"

export async function DELETE(request, { params }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await params


    await query("DELETE FROM consent_forms WHERE id = ?", [id])

    return NextResponse.json({ message: "Consent form deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting consent form:", error)
    return NextResponse.json({ error: "Failed to delete consent form" }, { status: 500 })
  }
}
