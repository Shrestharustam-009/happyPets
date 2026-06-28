import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const { token } = await params

    const patientData = await query(`
      SELECT p.*, u.full_name as owner_name, u.email as owner_email, u.phone_number
      FROM pets p
      JOIN users u ON p.user_id = u.id
      WHERE p.share_token = ?
    `, [token])

    if (patientData.length === 0) {
      return NextResponse.json({ error: "Patient report not found or invalid token" }, { status: 404 })
    }

    const patient = patientData[0]

    const medical = await query(`
      SELECT m.*, u.full_name as vet_name
      FROM medical_records m
      JOIN users u ON m.vet_id = u.id
      WHERE m.pet_id = ?
      ORDER BY m.visit_date DESC
    `, [patient.id])

    const vaccinations = await query(`
      SELECT v.*, u.full_name as vet_name
      FROM vaccinations v
      LEFT JOIN users u ON v.administered_by = u.id
      WHERE v.pet_id = ?
      ORDER BY v.given_date DESC
    `, [patient.id])

    return NextResponse.json({ patient, medical, vaccinations })
  } catch (error) {
    console.error("[public shared] Error fetching patient report:", error)
    return NextResponse.json({ error: "Failed to fetch patient report" }, { status: 500 })
  }
}
