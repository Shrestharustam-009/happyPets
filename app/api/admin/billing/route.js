import { NextResponse } from "next/server"
import { query, getConnection } from "@/lib/db"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const client_id = searchParams.get("client_id")
    const status = searchParams.get("status")

    let sql = `
      SELECT i.*, 
             u.full_name as client_name, u.email as client_email,
             p.name as pet_name
      FROM invoices i
      JOIN users u ON i.client_id = u.id
      LEFT JOIN pets p ON i.pet_id = p.id
      WHERE 1=1
    `
    const values = []

    if (client_id) {
      sql += " AND i.client_id = ?"
      values.push(client_id)
    }
    
    if (status) {
      sql += " AND i.status = ?"
      values.push(status)
    }

    sql += " ORDER BY i.issue_date DESC"

    const invoices = await query(sql, values)
    
    // For each invoice, optionally fetch items if requested, but for listing, just returning invoices is fine.
    // We'll fetch items in the detailed view or we can fetch them here.
    // For now, just return invoices.
    
    return NextResponse.json(invoices)
  } catch (error) {
    console.error("[v0] Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

export async function POST(request) {
  const connection = await getConnection();
  try {
    const body = await request.json()
    const { client_id, pet_id, total_amount, status, due_date, notes, items } = body

    if (!client_id || !items || !items.length) {
      return NextResponse.json({ error: "Client and at least one item are required" }, { status: 400 })
    }

    await connection.beginTransaction()
    
    // 1. Insert Invoice
    const [invoiceResult] = await connection.execute(
      `INSERT INTO invoices (client_id, pet_id, total_amount, status, due_date, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        client_id, 
        pet_id || null, 
        total_amount || 0, 
        status || 'Pending', 
        due_date || null, 
        notes || null
      ]
    )
    const invoiceId = invoiceResult.insertId

    // 2. Insert Items and Decrement Inventory
    for (const item of items) {
      await connection.execute(
        `INSERT INTO invoice_items (invoice_id, item_type, product_id, description, quantity, unit_price, subtotal) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          item.item_type,
          item.product_id || null,
          item.description,
          item.quantity,
          item.unit_price,
          item.subtotal
        ]
      )

      // If it's a Product, decrement stock
      if (item.item_type === 'Product' && item.product_id) {
        await connection.execute(
          `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`,
          [item.quantity, item.product_id, item.quantity]
        )
      }
    }

    await connection.commit()
    connection.release()

    return NextResponse.json(
      { message: "Invoice created successfully", id: invoiceId },
      { status: 201 }
    )
  } catch (error) {
    await connection.rollback()
    connection.release()
    console.error("[v0] Error creating invoice:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
