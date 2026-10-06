import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"

export async function GET(req) {
  try {
    if (!(await validateAdminRequest(req))) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    let users
    try {
      // Include each user's saved tab permissions so the Edit Access modal shows the real state
      users = await query(
        `SELECT id, email, full_name as fullName, phone_number as phoneNumber, role, is_active as isActive, allowed_tabs as allowedTabs 
         FROM users 
         ORDER BY created_at DESC`,
      )
    } catch (err) {
      // Some databases (e.g. older local copies) don't have the allowed_tabs column yet
      if (err?.code !== "ER_BAD_FIELD_ERROR") throw err
      users = await query(
        `SELECT id, email, full_name as fullName, phone_number as phoneNumber, role, is_active as isActive 
         FROM users 
         ORDER BY created_at DESC`,
      )
    }
    // No caching: permission/role changes must show up immediately after saving
    return NextResponse.json(users, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
