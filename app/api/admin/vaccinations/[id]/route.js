import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyAdminToken } from "@/lib/auth-middleware"

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      pet_id, 
      vaccine_name, 
      batch_number, 
      given_date, 
      next_due_date, 
      administered_by, 
      notes 
    } = body

    if (!pet_id || !vaccine_name || !given_date) {
      return NextResponse.json({ error: "Pet, Vaccine Name, and Given Date are required" }, { status: 400 })
    }

    await query(
      `UPDATE vaccinations 
       SET pet_id = ?, vaccine_name = ?, batch_number = ?, given_date = ?, next_due_date = ?, administered_by = ?, notes = ?
       WHERE id = ?`,
      [
        pet_id,
        vaccine_name,
        batch_number || null,
        given_date,
        next_due_date || null,
        administered_by || null,
        notes || null,
        id
      ]
    )

    return NextResponse.json({ message: "Vaccination updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating vaccination:", error)
    return NextResponse.json({ error: "Failed to update vaccination" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const adminUser = await verifyAdminToken(token)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden: Only administrators can delete records" }, { status: 403 })
    }

    await query("DELETE FROM vaccinations WHERE id = ?", [id])

    return NextResponse.json({ message: "Vaccination deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting vaccination:", error)
    return NextResponse.json({ error: "Failed to delete vaccination" }, { status: 500 })
  }
}
