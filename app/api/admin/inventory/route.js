import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"

export async function GET(request) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    let sql = "SELECT * FROM products"
    const values = []

    if (category && category !== "all") {
      sql += " WHERE category = ?"
      values.push(category)
    }

    sql += " ORDER BY name ASC"

    const products = await query(sql, values)
    return NextResponse.json(products)
  } catch (error) {
    console.error("[v0] Error fetching inventory:", error)
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
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
    const { name, description, price, category, stock, image_url, is_visible } = body

    if (!name || !price || !category) {
      return NextResponse.json({ error: "Name, Price, and Category are required" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO products (name, description, price, category, stock, image_url, is_visible) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        price,
        category,
        stock || 0,
        image_url || null,
        is_visible ? 1 : 0
      ]
    )

    return NextResponse.json(
      { message: "Product created successfully", id: result.insertId },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
