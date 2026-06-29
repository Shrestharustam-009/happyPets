import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"

export async function PUT(request, { params }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return (typeof NextResponse !== 'undefined' ? NextResponse : Response).json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    const { 
      pet_id, 
      vet_id, 
      visit_date, 
      chief_complaint, 
      temperature, 
      heart_rate,
      blood_pressure,
      pulse, 
      respiration, 
      weight, 
      clinical_findings, 
      primary_diagnosis, 
      differential_diagnoses, 
      treatment_interventions, 
      prescribed_medicines, 
      attachments_url,
      history,
      advice
    } = body

    if (!pet_id || !vet_id) {
      return NextResponse.json({ error: "Pet and Veterinarian are required" }, { status: 400 })
    }

    await query(
      `UPDATE medical_records 
       SET pet_id = ?, vet_id = ?, visit_date = ?, chief_complaint = ?, temperature = ?, heart_rate = ?, blood_pressure = ?, pulse = ?, respiration = ?, weight = ?, 
           clinical_findings = ?, primary_diagnosis = ?, differential_diagnoses = ?, treatment_interventions = ?, 
           prescribed_medicines = ?, attachments_url = ?, history = ?, advice = ?
       WHERE id = ?`,
      [
        pet_id,
        vet_id,
        visit_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
        chief_complaint || null,
        temperature || null,
        heart_rate || null,
        blood_pressure || null,
        pulse || null,
        respiration || null,
        weight || null,
        clinical_findings || null,
        primary_diagnosis || null,
        differential_diagnoses || null,
        treatment_interventions || null,
        prescribed_medicines || null,
        attachments_url || null,
        history || null,
        advice || null,
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
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await params


    await query("DELETE FROM medical_records WHERE id = ?", [id])

    return NextResponse.json({ message: "Medical record deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting medical record:", error)
    return NextResponse.json({ error: "Failed to delete medical record" }, { status: 500 })
  }
}
