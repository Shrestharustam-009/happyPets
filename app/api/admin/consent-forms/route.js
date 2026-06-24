import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const client_id = searchParams.get("client_id")

    let sql = `
      SELECT cf.*, 
             u.full_name as client_name, u.email as client_email,
             p.name as pet_name
      FROM consent_forms cf
      LEFT JOIN users u ON cf.client_id = u.id
      LEFT JOIN pets p ON cf.pet_id = p.id
    `
    const values = []

    if (client_id) {
      sql += " WHERE cf.client_id = ?"
      values.push(client_id)
    }

    sql += " ORDER BY cf.created_at DESC"

    const records = await query(sql, values)
    return NextResponse.json(records)
  } catch (error) {
    console.error("[v0] Error fetching consent forms:", error)
    return NextResponse.json({ error: "Failed to fetch consent forms" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      client_id, 
      pet_id,
      form_type, 
      status, 
      content_data,
      attachment_url
    } = body

    if (!client_id || !pet_id || !form_type) {
      return NextResponse.json({ error: "Client, Pet, and Form Type are required" }, { status: 400 })
    }

    // content_data can be an object or a pre-serialized string.
    const contentString = content_data
      ? (typeof content_data === "object" ? JSON.stringify(content_data) : content_data)
      : "{}"
    
    const result = await query(
      `INSERT INTO consent_forms (
        client_id, pet_id, form_type, status, content_data, attachment_url
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        client_id,
        pet_id,
        form_type,
        status || 'Signed',
        contentString,
        attachment_url || null
      ]
    )

    return NextResponse.json(
      { message: "Consent form recorded successfully", id: result.insertId },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Error logging consent form:", error)
    return NextResponse.json({ error: "Failed to log consent form" }, { status: 500 })
  }
}
