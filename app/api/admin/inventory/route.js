import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request) {
  try {
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
    const body = await request.json()
    const { name, description, price, category, stock, image_url } = body

    if (!name || !price || !category) {
      return NextResponse.json({ error: "Name, Price, and Category are required" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO products (name, description, price, category, stock, image_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        price,
        category,
        stock || 0,
        image_url || null
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
