import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"

export async function GET(request, { params }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params;
    
    const invoices = await query(`
      SELECT i.*, 
             u.full_name as client_name, u.email as client_email, u.phone_number, u.address,
             p.name as pet_name
      FROM invoices i
      JOIN users u ON i.client_id = u.id
      LEFT JOIN pets p ON i.pet_id = p.id
      WHERE i.id = ?
    `, [id])

    if (invoices.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    const invoice = invoices[0]
    
    const items = await query(`SELECT * FROM invoice_items WHERE invoice_id = ?`, [id])
    invoice.items = items

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("[v0] Error fetching invoice:", error)
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params;
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    await query(`UPDATE invoices SET status = ? WHERE id = ?`, [status, id])

    return NextResponse.json({ message: "Invoice status updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating invoice:", error)
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { id } = await params;

    // Note: Due to ON DELETE CASCADE, deleting the invoice deletes the items.
    // However, we are NOT reverting the product inventory here. 
    // Usually, cancelling an invoice should revert inventory, deleting might just be for mistakes.
    // To be safe, we allow delete.
    
    await query("DELETE FROM invoices WHERE id = ?", [id])

    return NextResponse.json({ message: "Invoice deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting invoice:", error)
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 })
  }
}
