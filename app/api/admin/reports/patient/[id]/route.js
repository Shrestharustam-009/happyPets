import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // 1. Patient & Owner Info
    const patientData = await query(`
      SELECT p.*, u.full_name as owner_name, u.email as owner_email, u.phone_number
      FROM pets p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [id])

    if (patientData.length === 0) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    const patient = patientData[0]

    // 2. Medical History
    const medical = await query(`
      SELECT m.*, u.full_name as vet_name
      FROM medical_records m
      JOIN users u ON m.vet_id = u.id
      WHERE m.pet_id = ?
      ORDER BY m.visit_date DESC
    `, [id])

    // 3. Vaccination Record
    const vaccinations = await query(`
      SELECT v.*, u.full_name as vet_name
      FROM vaccinations v
      LEFT JOIN users u ON v.administered_by = u.id
      WHERE v.pet_id = ?
      ORDER BY v.given_date DESC
    `, [id])

    // 4. Billing History
    // Fetch invoices and their items
    const invoices = await query(`
      SELECT i.* 
      FROM invoices i
      WHERE i.pet_id = ?
      ORDER BY i.issue_date DESC
    `, [id])

    for (const inv of invoices) {
      const items = await query(`SELECT * FROM invoice_items WHERE invoice_id = ?`, [inv.id])
      inv.items = items
    }

    return NextResponse.json({
      patient,
      medical,
      vaccinations,
      billing: invoices
    })

  } catch (error) {
    console.error("[v0] Error fetching patient report:", error)
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}
