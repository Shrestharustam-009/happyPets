import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyAdminToken } from "@/lib/auth-middleware"

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      pet_id, 
      vet_id, 
      visit_date, 
      chief_complaint, 
      temperature, 
      pulse, 
      respiration, 
      weight, 
      clinical_findings, 
      primary_diagnosis, 
      differential_diagnoses, 
      treatment_interventions, 
      prescribed_medicines, 
      attachments_url 
    } = body

    if (!pet_id || !vet_id) {
      return NextResponse.json({ error: "Pet and Veterinarian are required" }, { status: 400 })
    }

    await query(
      `UPDATE medical_records 
       SET pet_id = ?, vet_id = ?, visit_date = ?, chief_complaint = ?, temperature = ?, pulse = ?, respiration = ?, weight = ?, 
           clinical_findings = ?, primary_diagnosis = ?, differential_diagnoses = ?, treatment_interventions = ?, 
           prescribed_medicines = ?, attachments_url = ?
       WHERE id = ?`,
      [
        pet_id,
        vet_id,
        visit_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
        chief_complaint || null,
        temperature || null,
        pulse || null,
        respiration || null,
        weight || null,
        clinical_findings || null,
        primary_diagnosis || null,
        differential_diagnoses || null,
        treatment_interventions || null,
        prescribed_medicines || null,
        attachments_url || null,
        id
      ]
    )

    return NextResponse.json({ message: "Medical record updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating medical record:", error)
    return NextResponse.json({ error: "Failed to update medical record" }, { status: 500 })
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

    await query("DELETE FROM medical_records WHERE id = ?", [id])

    return NextResponse.json({ message: "Medical record deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting medical record:", error)
    return NextResponse.json({ error: "Failed to delete medical record" }, { status: 500 })
  }
}
