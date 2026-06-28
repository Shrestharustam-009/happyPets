import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"
import crypto from "crypto"

export async function GET(request) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const patients = await query(`
      SELECT p.id, p.share_token, p.user_id, p.species, p.breed, p.name, p.dob, p.age, p.sex, p.color, p.weight, p.identifying_marks, p.medical_history, p.photo_url, p.created_at,
             u.full_name as owner_name, u.email as owner_email
      FROM pets p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `)
    return NextResponse.json(patients)
  } catch (error) {
    console.error("[v0] Error fetching patients:", error)
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return (typeof NextResponse !== 'undefined' ? NextResponse : Response).json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    const { user_id, name, species, breed, dob, sex, color, weight, identifying_marks, medical_history, photo_url } = body

    if (!user_id || !name || !species) {
      return NextResponse.json({ error: "Owner, Name, and Species are required" }, { status: 400 })
    }
    
    const shareToken = crypto.randomUUID()
    const result = await query(
      `INSERT INTO pets (user_id, name, species, breed, dob, sex, color, weight, identifying_marks, medical_history, photo_url, share_token) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        shareToken
      ]
    )

    return NextResponse.json(
      { message: "Patient created successfully", id: result.insertId },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Error creating patient:", error)
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 })
  }
}
