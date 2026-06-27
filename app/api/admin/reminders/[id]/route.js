import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"

export async function PUT(request, { params }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params;
    
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    
    const { reminder_status, reminder_remarks } = body;

    // Build dynamic update query
    let updates = [];
    let queryParams = [];

    if (reminder_status !== undefined) {
      updates.push("reminder_status = ?");
      queryParams.push(reminder_status);
    }
    
    if (reminder_remarks !== undefined) {
      updates.push("reminder_remarks = ?");
      queryParams.push(reminder_remarks);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    queryParams.push(id);

    const updateQuery = `UPDATE vaccinations SET ${updates.join(', ')} WHERE id = ?`;
    await query(updateQuery, queryParams);

    return NextResponse.json({ success: true, message: "Reminder updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating reminder:", error)
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 })
  }
}
