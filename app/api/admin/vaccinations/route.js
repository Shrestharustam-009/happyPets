import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const pet_id = searchParams.get("pet_id")

    let sql = `
      SELECT v.*, 
             p.name as pet_name, p.species, p.breed, 
             u.full_name as vet_name,
             c.full_name as owner_name
      FROM vaccinations v
      LEFT JOIN pets p ON v.pet_id = p.id
      LEFT JOIN users u ON v.administered_by = u.id
      LEFT JOIN users c ON p.user_id = c.id
    `
    const values = []

    if (pet_id) {
      sql += " WHERE v.pet_id = ?"
      values.push(pet_id)
    }

    sql += " ORDER BY v.given_date DESC"

    const records = await query(sql, values)
    return NextResponse.json(records)
  } catch (error) {
    console.error("[v0] Error fetching vaccinations:", error)
    return NextResponse.json({ error: "Failed to fetch vaccinations" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
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
    
    const result = await query(
      `INSERT INTO vaccinations (
        pet_id, vaccine_name, batch_number, given_date, next_due_date, administered_by, notes
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        pet_id,
        vaccine_name,
        batch_number || null,
        given_date,
        next_due_date || null,
        administered_by || null,
        notes || null
      ]
    )

    return NextResponse.json(
      { message: "Vaccination logged successfully", id: result.insertId },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Error logging vaccination:", error)
    return NextResponse.json({ error: "Failed to log vaccination" }, { status: 500 })
  }
}
