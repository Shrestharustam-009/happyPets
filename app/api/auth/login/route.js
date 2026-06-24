import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return Response.json({ message: "Email and password are required" }, { status: 400 })
    }

    // Fetch user from database
    const users = await query("SELECT * FROM users WHERE email = ? AND is_active = TRUE", [email])

    if (!users.length) {
      return Response.json({ message: "Invalid email or password" }, { status: 401 })
    }

    const user = users[0]

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return Response.json({ message: "Invalid email or password" }, { status: 401 })
    }

    return Response.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token: "token-" + user.id,
    })
  } catch (error) {
    console.error("[v0] Error logging in:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
