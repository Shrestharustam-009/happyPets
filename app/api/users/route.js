import { query } from "@/lib/db"

export async function GET(req) {
  try {
    const users = await query(
      `SELECT id, email, full_name as fullName, phone_number as phoneNumber, role, is_active as isActive, allowed_tabs as allowedTabs 
       FROM users 
       ORDER BY created_at DESC`,
    )
    return Response.json(users)
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
