import { query } from "@/lib/db"
import { verifyAdminToken } from "@/lib/auth-middleware"


// Helper function to normalize image URLs to use API route
function normalizeImageUrl(imageUrl) {
  if (!imageUrl) return null
  // If already using API route, return as is
  if (imageUrl.startsWith("/api/uploads/")) return imageUrl
  // If using old /uploads/ path, convert to API route
  if (imageUrl.startsWith("/uploads/")) {
    return imageUrl.replace("/uploads/", "/api/uploads/")
  }
  // Otherwise return as is (for external URLs or placeholders)
  return imageUrl
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const featured = searchParams.get("featured")
    const sort = searchParams.get("sort") || "id"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const offset = (page - 1) * limit

    let sql = "SELECT * FROM products WHERE is_visible = 1"
    const params = []

    if (category) {
      sql += " AND category = ?"
      params.push(category)
    }

    if (featured === "true") {
      sql += " AND is_featured = 1"
    }

    // Sorting
    if (sort === "price-asc") {
      sql += " ORDER BY price ASC"
    } else if (sort === "price-desc") {
      sql += " ORDER BY price DESC"
    } else if (sort === "newest") {
      sql += " ORDER BY created_at DESC"
    } else {
      sql += " ORDER BY is_featured DESC, id DESC"
    }

    // Some MySQL/MariaDB setups (often in production) don't accept placeholders for LIMIT/OFFSET
    // in prepared statements and will throw ER_WRONG_ARGUMENTS. To keep it portable, we inline
    // the validated numeric values instead of using ? placeholders for these two.
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 12
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0
    sql += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`

    const products = await query(sql, params)

    // Normalize image URLs to use API route
    const normalizedProducts = products.map((product) => ({
      ...product,
      image_url: normalizeImageUrl(product.image_url),
    }))

    // Get total count
    let countSql = "SELECT COUNT(*) as total FROM products WHERE is_visible = 1"
    const countParams = []
    if (category) {
      countSql += " AND category = ?"
      countParams.push(category)
    }
    if (featured === "true") {
      countSql += " AND is_featured = 1"
    }

    const [{ total }] = await query(countSql, countParams)

    return Response.json({
      products: normalizedProducts,
      pagination: {
        current_page: page,
        total_items: total,
        total_pages: Math.ceil(total / limit),
        items_per_page: limit,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching products:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    const adminUser = await verifyAdminToken(token)
    if (!adminUser || adminUser.role !== "admin") {
      return Response.json({ message: "Unauthorized - Admin token required" }, { status: 401 })
    }

    const { name, description, price, discount_price, category, stock, image_url, is_visible } = await req.json()

    if (!name || !price || !category) {
      return Response.json({ message: "Missing required fields" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO products (name, description, price, discount_price, category, stock, image_url, is_visible)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, discount_price || null, category, stock || 0, image_url || null, is_visible ? 1 : 0],
    )

    return Response.json({
      message: "Product created successfully",
      product_id: result.insertId,
    })
  } catch (error) {
    console.error("[v0] Error creating product:", error)
    return Response.json({ message: "Internal server error" }, { status: 500 })
  }
}
