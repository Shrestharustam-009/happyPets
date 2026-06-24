import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const pet_id = searchParams.get("pet_id")

    let sql = `
      SELECT m.*, 
             p.name as pet_name, p.species, p.breed, 
             v.full_name as vet_name,
             c.full_name as owner_name
      FROM medical_records m
      LEFT JOIN pets p ON m.pet_id = p.id
      LEFT JOIN users v ON m.vet_id = v.id
      LEFT JOIN users c ON p.user_id = c.id
    `
    const values = []

    if (pet_id) {
      sql += " WHERE m.pet_id = ?"
      values.push(pet_id)
    }

    sql += " ORDER BY m.visit_date DESC"

    const records = await query(sql, values)
    return NextResponse.json(records)
  } catch (error) {
    console.error("[v0] Error fetching medical records:", error)
    return NextResponse.json({ error: "Failed to fetch medical records" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
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
    
    const result = await query(
      `INSERT INTO medical_records (
        pet_id, vet_id, visit_date, chief_complaint, temperature, pulse, respiration, weight, 
        clinical_findings, primary_diagnosis, differential_diagnoses, treatment_interventions, 
        prescribed_medicines, attachments_url
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        attachments_url || null
      ]
    )

    return NextResponse.json(
      { message: "Medical record created successfully", id: result.insertId },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Error creating medical record:", error)
    return NextResponse.json({ error: "Failed to create medical record" }, { status: 500 })
  }
}
