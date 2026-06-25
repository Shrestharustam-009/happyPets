import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  const users = await query("SELECT id FROM users WHERE role = 'admin' AND is_active = 1 LIMIT 1")
  if (users.length > 0) {
    return NextResponse.json({ token: `admin-token-${users[0].id}` })
  }
  return NextResponse.json({ token: null })
}
