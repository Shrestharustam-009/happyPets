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
    const { user_id, name, species, breed, dob, sex, color, weight, identifying_marks, medical_history, photo_url } = body

    if (!user_id || !name || !species) {
      return NextResponse.json({ error: "Owner, Name, and Species are required" }, { status: 400 })
    }

    await query(
      `UPDATE pets 
       SET user_id = ?, name = ?, species = ?, breed = ?, dob = ?, sex = ?, color = ?, weight = ?, identifying_marks = ?, medical_history = ?, photo_url = ?
       WHERE id = ?`,
      [
        user_id,
        name,
        species,
        breed || null,
        dob || null,
        sex || null,
        color || null,
        weight || null,
        identifying_marks || null,
        medical_history || null,
        photo_url || null,
        id
      ]
    )

    return NextResponse.json({ message: "Patient updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating patient:", error)
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await params;

    // Attempt to delete
    await query("DELETE FROM pets WHERE id = ?", [id])

    return NextResponse.json({ message: "Patient deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting patient:", error)
    return NextResponse.json({ error: "Failed to delete patient. They might have dependent records (e.g. medical records)." }, { status: 500 })
  }
}
