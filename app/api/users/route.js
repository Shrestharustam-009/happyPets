import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"

export async function GET(req) {
  try {
    if (!(await validateAdminRequest(req))) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const users = await query(
      `SELECT id, email, full_name as fullName, phone_number as phoneNumber, role, is_active as isActive, allowed_tabs as allowedTabs 
       FROM users 
       ORDER BY created_at DESC`,
    )
    return NextResponse.json(users, { headers: { "Cache-Control": "public, max-age=300" } })
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
