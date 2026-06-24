import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"

export async function PUT(request, { params }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params;
    const body = await request.json()
    const { full_name, email, phone_number, address, is_active } = body

    if (!full_name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const trimmedEmail = email && email.trim() !== "" ? email.trim() : null

    // Check if email already exists for another user (if provided)
    if (trimmedEmail) {
      const existingUsers = await query("SELECT id FROM users WHERE email = ? AND id != ?", [trimmedEmail, id])
      if (existingUsers.length > 0) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }
    }

    await query(
      "UPDATE users SET full_name = ?, email = ?, phone_number = ?, address = ?, is_active = ? WHERE id = ?",
      [full_name, trimmedEmail, phone_number || null, address || null, is_active !== undefined ? is_active : true, id]
    )

    return NextResponse.json({ message: "Client updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating client:", error)
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await params;

    // Check if client has pets or invoices (if those exist, might restrict deletion or cascade)
    // For now, we will allow soft delete or just regular delete. Let's do regular delete.
    await query("DELETE FROM users WHERE id = ?", [id])

    return NextResponse.json({ message: "Client deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting client:", error)
    // If there's a foreign key constraint failure, it will fall here.
    return NextResponse.json({ error: "Failed to delete client. They might have dependent records." }, { status: 500 })
  }
}
