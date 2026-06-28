import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { normalizeAuthToken, getUserIdFromToken, isAdminToken } from "@/lib/token-utils"

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const { id } = await params

    const token = normalizeAuthToken(request.headers.get("authorization"))
    const isAdmin = isAdminToken(token)
    const tokenUserId = getUserIdFromToken(token)

    if (!isAdmin && !tokenUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const records = await query(
      `SELECT tr.*, 
              p.user_id as owner_id,
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

    const report = records[0]

    if (!isAdmin && tokenUserId !== report.owner_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("[public] Error fetching test report:", error)
    return NextResponse.json({ error: "Failed to fetch test report" }, { status: 500 })
  }
}
