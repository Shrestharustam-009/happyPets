import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    console.log(email, password);

    if (!email || !password) {
      return Response.json({ message: "Email and password are required" }, { status: 400 })
    }

    // Fetch admin/vet/reception user from database
    const admins = await query("SELECT * FROM users WHERE email = ? AND role IN ('admin', 'vet', 'reception') AND is_active = TRUE", [email])

    if (!admins.length) {
      return Response.json({ message: "Invalid admin credentials" }, { status: 401 })
    }

    const admin = admins[0]

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password)

    if (!isPasswordValid) {
      return Response.json({ message: "Invalid admin credentials" }, { status: 401 })
    }

    return Response.json({
      message: "Admin login successful",
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        role: admin.role,
      },
      token: "admin-token-" + admin.id,
    })
  } catch (error) {
    console.error("[v0] Error admin login:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
