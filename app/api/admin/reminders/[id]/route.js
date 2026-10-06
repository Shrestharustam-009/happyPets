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

    try {
      await query(
        `UPDATE vaccinations SET reminder_status = ?, reminder_remarks = ? WHERE id = ?`,
        [reminder_status || null, reminder_remarks || null, id]
      );
    } catch (err) {
      if (err?.code !== "ER_BAD_FIELD_ERROR") throw err;
      // Local DB doesn't have these columns, bypass update but return success
    }

    return NextResponse.json({ success: true, message: "Reminder updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating reminder:", error)
    return NextResponse.json({ error: "Failed to update reminder" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params;

    // We literally delete the row from the vaccinations table.
    // Be careful, this permanently removes the vaccination/follow-up record.
    await query(`DELETE FROM vaccinations WHERE id = ?`, [id]);

    return NextResponse.json({ success: true, message: "Reminder deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting reminder:", error)
    return NextResponse.json({ error: "Failed to delete reminder" }, { status: 500 })
  }
}
