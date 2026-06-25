import { query } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"

export async function PUT(req, { params }) {
  try {
    if (!(await validateAdminRequest(req))) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await params;
    
    let body;
    try {
      body = await req.json();
    } catch (err) {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const { is_active, role } = body

    const updates = []
    const values = []

    if (is_active !== undefined) {
      updates.push("is_active = ?")
      values.push(is_active ? 1 : 0)
    }

    if (role !== undefined) {
      updates.push("role = ?")
      values.push(role)
    }

    if (updates.length > 0) {
      values.push(id)
      await query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values)
    }

    return Response.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
