import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyAdminToken } from "@/lib/auth-middleware"

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, price, category, stock, image_url } = body

    if (!name || !price || !category) {
      return NextResponse.json({ error: "Name, Price, and Category are required" }, { status: 400 })
    }

    await query(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, category = ?, stock = ?, image_url = ?
       WHERE id = ?`,
      [
        name,
        description || null,
        price,
        category,
        stock || 0,
        image_url || null,
        id
      ]
    )

    return NextResponse.json({ message: "Product updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const adminUser = await verifyAdminToken(token)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden: Only administrators can delete records" }, { status: 403 })
    }

    // First check if it's used in invoices
    const usedInInvoices = await query("SELECT id FROM invoice_items WHERE product_id = ? LIMIT 1", [id])
    if (usedInInvoices.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete this product because it has been billed in past invoices. Try setting stock to 0 instead." 
      }, { status: 400 })
    }

    await query("DELETE FROM products WHERE id = ?", [id])

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
