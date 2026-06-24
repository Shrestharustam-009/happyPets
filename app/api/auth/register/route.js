import { query } from "@/lib/db"
import { validatePassword } from "@/lib/auth-utils"
import bcrypt from "bcryptjs"

export async function POST(req) {
  try {
    const { email, fullName, password } = await req.json()

    if (!validatePassword(password)) {
      return Response.json({ message: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Check if user already exists
    const existingUsers = await query("SELECT id FROM users WHERE email = ?", [email])
    if (existingUsers.length) {
      return Response.json({ message: "Email already registered" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert user into database
    const result = await query("INSERT INTO users (email, full_name, password, role) VALUES (?, ?, ?, ?)", [
      email,
      fullName,
      hashedPassword,
      "user",
    ])

    const user = {
      id: result.insertId,
      email,
      fullName,
      role: "user",
    }

    return Response.json({
      message: "Registration successful",
      user,
      token: "token-" + user.id,
    })
  } catch (error) {
    console.error("[v0] Error registering user:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
