import { query } from "@/lib/db"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "fallback_happypets_secret_key_2026"

export async function POST(req) {
  try {
    let email, password;
    try {
      let body;
    try {
      body = await req.json();
    } catch (err) {
      return (typeof NextResponse !== 'undefined' ? NextResponse : Response).json({ error: "Invalid JSON payload" }, { status: 400 });
    };
      email = body?.email;
      password = body?.password;
    } catch (parseError) {
      return Response.json({ message: "Invalid request format" }, { status: 400 });
    }
    if (!email || !password) {
      return Response.json({ message: "Email and password are required" }, { status: 400 })
    }

    // Fetch admin/vet/reception user from database
    const admins = await query(
      "SELECT * FROM users WHERE email = ? AND role IN ('admin', 'vet', 'reception', 'veterinarian', 'vet_assistant') AND is_active = TRUE", 
      [email]
    )

    if (!admins.length) {
      return Response.json({ message: "Invalid admin credentials" }, { status: 401 })
    }

    const admin = admins[0]

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password)

    if (!isPasswordValid) {
      return Response.json({ message: "Invalid admin credentials" }, { status: 401 })
    }

    // Parse allowed_tabs from DB
    let allowedTabs = null
    try {
      allowedTabs = admin.allowed_tabs ? (typeof admin.allowed_tabs === "string" ? JSON.parse(admin.allowed_tabs) : admin.allowed_tabs) : null
    } catch (e) {
      allowedTabs = null
    }

    const token = jwt.sign(
      { id: admin.id, role: admin.role, isAdmin: true },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return Response.json({
      message: "Admin login successful",
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        role: admin.role,
        allowed_tabs: allowedTabs,
      },
      token: token,
    })
  } catch (error) {
    console.error("[v0] Error admin login:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
