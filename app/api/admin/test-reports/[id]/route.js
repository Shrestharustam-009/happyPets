import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"

export async function GET(request, { params }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    const records = await query(
      `SELECT tr.*, 
              p.name as pet_name, p.dob as pet_dob, p.species as pet_species, p.sex as pet_sex, 
              p.breed as pet_breed, p.color as pet_color, p.identifying_marks as pet_identifying_marks, 
              p.photo_url as pet_photo_url, p.weight as pet_weight,
              u.full_name as client_name, u.email as client_email, u.phone_number as client_phone, 
              u.address as client_address,
              v.full_name as vet_name
       FROM test_reports tr
       LEFT JOIN pets p ON tr.pet_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN users v ON tr.vet_id = v.id
       WHERE tr.id = ?`,
      [id]
    )

    if (records.length === 0) {
      return NextResponse.json({ error: "Test report not found" }, { status: 404 })
    }

    return NextResponse.json(records[0])
  } catch (error) {
    console.error("[v0] Error fetching test report:", error)
    return NextResponse.json({ error: "Failed to fetch test report" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    let body
    try {
      body = await request.json()
    } catch (err) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    const { pet_id, vet_id, report_date, results } = body

    if (!pet_id || !vet_id) {
      return NextResponse.json({ error: "Pet and Veterinarian are required" }, { status: 400 })
    }

    const resultsString = results
      ? (typeof results === "object" ? JSON.stringify(results) : results)
      : "{}"

    const reportDateVal = report_date ? new Date(report_date) : new Date()

    await query(
      `UPDATE test_reports SET pet_id = ?, vet_id = ?, report_date = ?, results = ? WHERE id = ?`,
      [pet_id, vet_id, reportDateVal, resultsString, id]
    )

    return NextResponse.json({ message: "Test report updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating test report:", error)
    return NextResponse.json({ error: "Failed to update test report" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params

    await query("DELETE FROM test_reports WHERE id = ?", [id])

    return NextResponse.json({ message: "Test report deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting test report:", error)
    return NextResponse.json({ error: "Failed to delete test report" }, { status: 500 })
  }
}
