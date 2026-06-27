import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"
import { validateAdminRequest } from "@/lib/auth-middleware"
import crypto from "crypto"

export async function GET(request) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const clients = await query(
      "SELECT id, email, full_name, phone_number, address, is_active, created_at FROM users WHERE role = 'client' ORDER BY created_at DESC"
    )
    return NextResponse.json(clients)
  } catch (error) {
    console.error("[v0] Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
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
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }
    const { full_name, email, phone_number, address, password } = body;

    if (!full_name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const trimmedEmail = email && email.trim() !== "" ? email.trim() : `client_${Date.now()}@happypets.local`

    // Check if email already exists (if provided)
    if (trimmedEmail) {
      const existingUsers = await query("SELECT id FROM users WHERE email = ?", [trimmedEmail])
      if (existingUsers.length > 0) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }
    }

    // Hash password if provided, otherwise create a secure random one
    const plainPassword = password || crypto.randomBytes(9).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    const result = await query(
      "INSERT INTO users (full_name, email, phone_number, address, password, role) VALUES (?, ?, ?, ?, ?, 'client')",
      [full_name, trimmedEmail, phone_number || null, address || null, hashedPassword]
    )

    return NextResponse.json(
      { message: "Client created successfully", id: result.insertId },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Error creating client:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}
