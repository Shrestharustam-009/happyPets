import { NextResponse } from "next/server"
import { query, getConnection } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"

export async function GET(request) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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
    
    return NextResponse.json(invoices)
  } catch (error) {
    console.error("[v0] Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return (typeof NextResponse !== 'undefined' ? NextResponse : Response).json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    const { client_id, phone_number, pet_id, total_amount, status, due_date, notes, items } = body

    if (!client_id || !items || !items.length) {
      return NextResponse.json({ error: "Client and at least one item are required" }, { status: 400 })
    }

    const connection = await getConnection()
    let transactionStarted = false
    try {
      await connection.beginTransaction()
      transactionStarted = true

      // 0. Update client phone number if provided
      if (phone_number !== undefined) {
        await connection.execute(
          `UPDATE users SET phone_number = ? WHERE id = ?`,
          [phone_number || null, client_id]
        )
      }
      
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
          const [updateResult] = await connection.execute(
            `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`,
            [item.quantity, item.product_id, item.quantity]
          )
          
          // CRITICAL: Prevent phantom inventory sales
          if (updateResult.affectedRows === 0) {
            throw new Error(`Insufficient stock for product ID: ${item.product_id}`)
          }
        }
      }

      await connection.commit()
      return NextResponse.json(
        { message: "Invoice created successfully", id: invoiceId },
        { status: 201 }
      )
    } catch (error) {
      if (transactionStarted) {
        try {
          await connection.rollback()
        } catch (rollbackError) {
          console.error("[v0] Rollback error:", rollbackError)
        }
      }
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("[v0] Error creating invoice:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
