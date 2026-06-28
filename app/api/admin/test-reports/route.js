import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"
import crypto from "crypto"

export async function GET(request) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const pet_id = searchParams.get("pet_id")

    let sql = `
      SELECT tr.*, 
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
    `
    const values = []

    if (pet_id) {
      sql += " WHERE tr.pet_id = ?"
      values.push(pet_id)
    }

    sql += " ORDER BY tr.report_date DESC"

    const records = await query(sql, values)
    return NextResponse.json(records)
  } catch (error) {
    console.error("[v0] Error fetching test reports:", error)
    return NextResponse.json({ error: "Failed to fetch test reports" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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
    const shareToken = crypto.randomUUID()

    const result = await query(
      `INSERT INTO test_reports (pet_id, vet_id, report_date, results, share_token) VALUES (?, ?, ?, ?, ?)`,
      [pet_id, vet_id, reportDateVal, resultsString, shareToken]
    )

    return NextResponse.json(
      { message: "Test report created successfully", id: result.insertId },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Error creating test report:", error)
    return NextResponse.json({ error: "Failed to create test report" }, { status: 500 })
  }
}
